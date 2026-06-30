import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { uploadCatPhoto, uploadCatPhotoById, uploadSightingPhoto } from "./supabaseStorage";
import { getApproximateLocation, reverseGeocodeLocation } from "../utils/location";
import { uid } from "../utils/id";
import { Cat, Sighting, Favorite, UserBadge, Activity, Follow, SightingLike, SightingComment } from "../types";

function _db() {
  if (!db) throw new Error("Firestore non initialisé");
  return db;
}

function toISO(v: unknown): string {
  return v instanceof Timestamp ? v.toDate().toISOString() : new Date().toISOString();
}

function catToDoc(cat: Cat): Record<string, unknown> {
  return {
    id: cat.id,
    createdBy: cat.user_id,
    nickname: cat.name || "",
    color: cat.color || "",
    sociability: cat.sociability || "",
    note: cat.note || "",
    photoUrl: cat.photo_url,
    photos: cat.photos || [cat.photo_url],
    sightingsCount: 0,
    isPublic: true,
    createdAt: Timestamp.fromDate(new Date(cat.created_at)),
    updatedAt: Timestamp.now(),
    lastSeenAt: Timestamp.fromDate(new Date(cat.created_at)),
  };
}

function docToCat(data: Record<string, unknown>): Cat {
  const photoUrl = (data.photoUrl as string) || "";
  const photos = (data.photos as string[]) || (photoUrl ? [photoUrl] : []);
  return {
    id: (data.id as string) || "",
    user_id: (data.createdBy as string) || "",
    name: (data.nickname as string) || undefined,
    photo_url: photoUrl,
    photos,
    color: (data.color as string) || undefined,
    sociability: (data.sociability as string) || undefined,
    note: (data.note as string) || undefined,
    created_at: toISO(data.createdAt),
  };
}

function sightingToDoc(s: Sighting, locationLabel?: string): Record<string, unknown> {
  return {
    id: s.id,
    catId: s.cat_id,
    userId: s.user_id,
    latitude: s.latitude,
    longitude: s.longitude,
    locationLabel: locationLabel || s.location_label || null,
    approximateLocationLabel: locationLabel || s.location_label || null,
    note: s.notes || "",
    photoUrl: s.photo_url || "",
    createdAt: Timestamp.fromDate(new Date(s.sighted_at)),
  };
}

function docToSighting(data: Record<string, unknown>): Sighting {
  return {
    id: (data.id as string) || "",
    cat_id: (data.catId as string) || "",
    user_id: (data.userId as string) || "",
    latitude: (data.latitude as number) || 0,
    longitude: (data.longitude as number) || 0,
    notes: (data.note as string) || undefined,
    photo_url: (data.photoUrl as string) || undefined,
    sighted_at: toISO(data.createdAt),
    location_label: ((data.locationLabel as string | null) || (data.approximateLocationLabel as string | null)) || undefined,
  };
}

function favoriteToDoc(f: Favorite): Record<string, unknown> {
  return {
    id: f.id,
    userId: f.user_id,
    catId: f.cat_id,
    createdAt: Timestamp.fromDate(new Date(f.created_at)),
  };
}

function docToFavorite(data: Record<string, unknown>): Favorite {
  return {
    id: (data.id as string) || "",
    user_id: (data.userId as string) || "",
    cat_id: (data.catId as string) || "",
    created_at: toISO(data.createdAt),
  };
}

export const CatCloud = {
  async getAll(): Promise<Cat[]> {
    const snap = await getDocs(collection(_db(), "cats"));
    return snap.docs.map((d) => docToCat(d.data() as Record<string, unknown>));
  },

  async getByUser(userId: string): Promise<Cat[]> {
    const q = query(collection(_db(), "cats"), where("createdBy", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToCat(d.data() as Record<string, unknown>));
  },

  async create(cat: Cat, localPhotoUri?: string): Promise<Cat> {
    let photoUrl = cat.photo_url;
    let photos = [...(cat.photos || [])];
    if (localPhotoUri && !localPhotoUri.startsWith("http")) {
      const uploaded = await uploadCatPhoto(localPhotoUri, cat.user_id, cat.id);
      if (uploaded) {
        photoUrl = uploaded;
        photos = [uploaded];
      }
    }
    const finalCat = { ...cat, photo_url: photoUrl, photos };
    const docRef = doc(_db(), "cats", cat.id);
    console.log("CatCloud.create: writing cat", cat.id, "photo_url:", photoUrl.substring(0, 50));
    await setDoc(docRef, catToDoc(finalCat));
    console.log("CatCloud.create: success", cat.id);
    return finalCat;
  },

  async addPhoto(catId: string, userId: string, localPhotoUri: string): Promise<string | null> {
    if (!localPhotoUri) return null;
    const photoId = uid();
    let uploadedUrl = localPhotoUri;
    if (!localPhotoUri.startsWith("http")) {
      const uploaded = await uploadCatPhotoById(localPhotoUri, userId, catId, photoId);
      if (uploaded) uploadedUrl = uploaded;
    }
    const docRef = doc(_db(), "cats", catId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentPhotos: string[] = (data.photos as string[]) || [];
      await setDoc(docRef, {
        photos: [...currentPhotos, uploadedUrl],
        updatedAt: Timestamp.now(),
      }, { merge: true });
    }
    return uploadedUrl;
  },

  async updateSightingCount(catId: string, count: number): Promise<void> {
    const docRef = doc(_db(), "cats", catId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await setDoc(docRef, { sightingsCount: count, updatedAt: Timestamp.now() }, { merge: true });
    }
  },
};

export const SightingCloud = {
  async getAll(): Promise<Sighting[]> {
    const snap = await getDocs(collection(_db(), "sightings"));
    return snap.docs.map((d) => docToSighting(d.data() as Record<string, unknown>));
  },

  async getByUser(userId: string): Promise<Sighting[]> {
    const q = query(collection(_db(), "sightings"), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToSighting(d.data() as Record<string, unknown>));
  },

  async create(sighting: Sighting, localPhotoUri?: string): Promise<Sighting> {
    let photoUrl = sighting.photo_url;
    if (localPhotoUri && !localPhotoUri.startsWith("http")) {
      const uploaded = await uploadSightingPhoto(localPhotoUri, sighting.user_id, sighting.id);
      if (uploaded) photoUrl = uploaded;
    }
    const final = { ...sighting, photo_url: photoUrl };
    const locationLabel = await reverseGeocodeLocation(sighting.latitude, sighting.longitude);
    const docRef = doc(_db(), "sightings", sighting.id);
    console.log("SightingCloud.create: writing", sighting.id);
    await setDoc(docRef, sightingToDoc(final, locationLabel || undefined));
    console.log("SightingCloud.create: success", sighting.id);
    return final;
  },

  async getAllForCat(catId: string): Promise<Sighting[]> {
    const q = query(collection(_db(), "sightings"), where("catId", "==", catId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToSighting(d.data() as Record<string, unknown>));
  },
};

export const FavoriteCloud = {
  async getAll(userId: string): Promise<Favorite[]> {
    const q = query(collection(_db(), "favorites"), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToFavorite(d.data() as Record<string, unknown>));
  },

  async add(fav: Favorite): Promise<void> {
    await setDoc(doc(_db(), "favorites", fav.id), favoriteToDoc(fav));
  },

  async remove(catId: string, userId: string): Promise<void> {
    const q = query(
      collection(_db(), "favorites"),
      where("catId", "==", catId),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  },
};

export const BadgeCloud = {
  async getCounts(userId: string): Promise<{ cats: number; favs: number; sightings: number }> {
    const [catsSnap, sightSnap, favSnap] = await Promise.all([
      getDocs(query(collection(_db(), "cats"), where("createdBy", "==", userId))),
      getDocs(query(collection(_db(), "sightings"), where("userId", "==", userId))),
      getDocs(query(collection(_db(), "favorites"), where("userId", "==", userId))),
    ]);
    return {
      cats: catsSnap.size,
      sightings: sightSnap.size,
      favs: favSnap.size,
    };
  },

  async getAll(userId: string): Promise<UserBadge[]> {
    const q = query(collection(_db(), "userBadges"), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: (data.id as string) || "",
        badge_id: (data.badgeId as string) || "",
        user_id: (data.userId as string) || "",
        earned_at: toISO(data.earnedAt),
      };
    });
  },

  async saveBadge(ub: UserBadge): Promise<void> {
    await setDoc(doc(_db(), "userBadges", ub.id), {
      id: ub.id,
      badgeId: ub.badge_id,
      userId: ub.user_id,
      earnedAt: Timestamp.fromDate(new Date(ub.earned_at)),
    });
  },

  async deleteBadge(badgeId: string): Promise<void> {
    await deleteDoc(doc(_db(), "userBadges", badgeId));
  },
};

export const ActivityCloud = {
  async getAll(): Promise<Activity[]> {
    const snap = await getDocs(
      query(collection(_db(), "activities"), orderBy("createdAt", "desc"))
    );
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: (data.id as string) || "",
        user_id: (data.userId as string) || "",
        username: (data.username as string) || "",
        type: (data.type as Activity["type"]) || "spotted",
        cat_id: (data.catId as string) || "",
        cat_name: (data.catName as string) || "",
        created_at: toISO(data.createdAt),
      };
    });
  },

  async add(activity: Activity): Promise<void> {
    await setDoc(doc(_db(), "activities", activity.id), {
      id: activity.id,
      userId: activity.user_id,
      username: activity.username,
      type: activity.type,
      catId: activity.cat_id,
      catName: activity.cat_name,
      createdAt: Timestamp.fromDate(new Date(activity.created_at)),
    });
  },
};

export const CatMerge = {
  async merge(keepId: string, removeId: string): Promise<void> {
    const firestore = _db();
    const batch = writeBatch(firestore);

    // Move sightings from removeId to keepId
    const sightQ = query(collection(firestore, "sightings"), where("catId", "==", removeId));
    const sightSnap = await getDocs(sightQ);
    for (const d of sightSnap.docs) {
      batch.set(d.ref, { catId: keepId }, { merge: true });
    }

    // Move favorites from removeId to keepId
    const favQ = query(collection(firestore, "favorites"), where("catId", "==", removeId));
    const favSnap = await getDocs(favQ);
    for (const d of favSnap.docs) {
      batch.set(d.ref, { catId: keepId }, { merge: true });
    }

    // Delete the removed cat
    batch.delete(doc(firestore, "cats", removeId));

    // Update sighting count on kept cat (include both current and moved sightings)
    const [keptSights, movedSights] = await Promise.all([
      getDocs(query(collection(firestore, "sightings"), where("catId", "==", keepId))),
      getDocs(query(collection(firestore, "sightings"), where("catId", "==", removeId))),
    ]);
    batch.set(doc(firestore, "cats", keepId), {
      sightingsCount: keptSights.size + movedSights.size,
      updatedAt: Timestamp.now(),
    }, { merge: true });

    await batch.commit();
  },
};

function followToDoc(f: Follow): Record<string, unknown> {
  return {
    id: f.id,
    followerId: f.follower_id,
    followingId: f.following_id,
    createdAt: Timestamp.fromDate(new Date(f.created_at)),
  };
}

function docToFollow(data: Record<string, unknown>): Follow {
  return {
    id: (data.id as string) || "",
    follower_id: (data.followerId as string) || "",
    following_id: (data.followingId as string) || "",
    created_at: toISO(data.createdAt),
  };
}

function sightingLikeToDoc(l: SightingLike): Record<string, unknown> {
  return {
    id: l.id,
    sightingId: l.sighting_id,
    userId: l.user_id,
    createdAt: Timestamp.fromDate(new Date(l.created_at)),
  };
}

function docToSightingLike(data: Record<string, unknown>): SightingLike {
  return {
    id: (data.id as string) || "",
    sighting_id: (data.sightingId as string) || "",
    user_id: (data.userId as string) || "",
    created_at: toISO(data.createdAt),
  };
}

function sightingCommentToDoc(c: SightingComment): Record<string, unknown> {
  return {
    id: c.id,
    sightingId: c.sighting_id,
    userId: c.user_id,
    username: c.username,
    text: c.text,
    createdAt: Timestamp.fromDate(new Date(c.created_at)),
  };
}

function docToSightingComment(data: Record<string, unknown>): SightingComment {
  return {
    id: (data.id as string) || "",
    sighting_id: (data.sightingId as string) || "",
    user_id: (data.userId as string) || "",
    username: (data.username as string) || "",
    text: (data.text as string) || "",
    created_at: toISO(data.createdAt),
  };
}

export const FollowCloud = {
  async getAll(userId: string): Promise<Follow[]> {
    const q = query(collection(_db(), "follows"), where("followerId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToFollow(d.data() as Record<string, unknown>));
  },

  async add(follow: Follow): Promise<void> {
    await setDoc(doc(_db(), "follows", follow.id), followToDoc(follow));
  },

  async remove(followerId: string, followingId: string): Promise<void> {
    const q = query(
      collection(_db(), "follows"),
      where("followerId", "==", followerId),
      where("followingId", "==", followingId)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  },
};

export const SightingLikeCloud = {
  async getAll(): Promise<SightingLike[]> {
    const snap = await getDocs(collection(_db(), "sighting_likes"));
    return snap.docs.map((d) => docToSightingLike(d.data() as Record<string, unknown>));
  },

  async add(like: SightingLike): Promise<void> {
    await setDoc(doc(_db(), "sighting_likes", like.id), sightingLikeToDoc(like));
  },

  async remove(sightingId: string, userId: string): Promise<void> {
    const q = query(
      collection(_db(), "sighting_likes"),
      where("sightingId", "==", sightingId),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  },
};

export const SightingCommentCloud = {
  async getAll(): Promise<SightingComment[]> {
    const snap = await getDocs(collection(_db(), "sighting_comments"));
    return snap.docs.map((d) => docToSightingComment(d.data() as Record<string, unknown>));
  },

  async add(comment: SightingComment): Promise<void> {
    await setDoc(doc(_db(), "sighting_comments", comment.id), sightingCommentToDoc(comment));
  },
};
