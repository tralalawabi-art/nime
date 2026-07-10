import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db, auth, ensureUserSession } from "../lib/firebase";

export interface Bookmark {
  id?: string;
  userId: string;
  animeSlug: string;
  title: string;
  poster: string;
  rating?: string;
  addedAt: any;
}

export interface WatchHistory {
  id?: string;
  userId: string;
  animeSlug: string;
  animeTitle: string;
  episodeSlug: string;
  episodeTitle: string;
  poster: string;
  watchedAt: any;
}

export interface Comment {
  id?: string;
  episodeSlug: string;
  userId: string;
  userDisplayName: string;
  text: string;
  createdAt: any;
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const isPermissionError = (err: any): boolean => {
  const msg = err instanceof Error ? err.message : String(err);
  const code = err && typeof err === "object" && "code" in err ? (err as any).code : "";
  return msg.toLowerCase().includes("permission") || code === "permission-denied" || msg.toLowerCase().includes("insufficient");
};

let useFallback = false;
let sessionUser: { uid: string; displayName?: string | null; email?: string | null; isAnonymous: boolean } | null = null;

async function getSessionUser() {
  if (auth.currentUser) {
    useFallback = false;
    return {
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.displayName,
      email: auth.currentUser.email,
      isAnonymous: auth.currentUser.isAnonymous
    };
  }
  if (useFallback) {
    return getFallbackUser();
  }
  try {
    const user = await ensureUserSession();
    sessionUser = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      isAnonymous: user.isAnonymous
    };
    return sessionUser;
  } catch (err) {
    console.warn("Firebase Auth failed, switching to local storage fallback:", err);
    useFallback = true;
    return getFallbackUser();
  }
}

function getFallbackUser() {
  if (!sessionUser) {
    let localUid = localStorage.getItem("maounime_local_uid");
    if (!localUid) {
      localUid = "local_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("maounime_local_uid", localUid);
    }
    sessionUser = {
      uid: localUid,
      displayName: "Lokal User",
      email: null,
      isAnonymous: true
    };
  }
  return sessionUser;
}

export const firebaseService = {
  // Bookmarks
  async addBookmark(animeSlug: string, title: string, poster: string, rating?: string): Promise<void> {
    const path = `bookmarks/${auth.currentUser?.uid || "unknown"}_${animeSlug}`;
    try {
      if (useFallback) throw new Error("Fallback mode active");
      const user = await getSessionUser();
      const bookmarkId = `${user.uid}_${animeSlug}`;
      const docRef = doc(db, "bookmarks", bookmarkId);
      
      await setDoc(docRef, {
        userId: user.uid,
        animeSlug,
        title,
        poster: poster || "",
        rating: rating || "",
        addedAt: serverTimestamp()
      });
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      console.warn("addBookmark Firestore failed, saving locally:", err);
      useFallback = true;
      const user = getFallbackUser();
      const localBookmarks = JSON.parse(localStorage.getItem("maounime_bookmarks") || "[]");
      const filtered = localBookmarks.filter((b: any) => b.animeSlug !== animeSlug);
      filtered.unshift({
        id: `${user.uid}_${animeSlug}`,
        userId: user.uid,
        animeSlug,
        title,
        poster: poster || "",
        rating: rating || "",
        addedAt: new Date().toISOString()
      });
      localStorage.setItem("maounime_bookmarks", JSON.stringify(filtered));
    }
  },

  async removeBookmark(animeSlug: string): Promise<void> {
    const path = `bookmarks/${auth.currentUser?.uid || "unknown"}_${animeSlug}`;
    try {
      if (useFallback) throw new Error("Fallback mode active");
      const user = await getSessionUser();
      const bookmarkId = `${user.uid}_${animeSlug}`;
      const docRef = doc(db, "bookmarks", bookmarkId);
      await deleteDoc(docRef);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      console.warn("removeBookmark Firestore failed, removing locally:", err);
      useFallback = true;
      const localBookmarks = JSON.parse(localStorage.getItem("maounime_bookmarks") || "[]");
      const filtered = localBookmarks.filter((b: any) => b.animeSlug !== animeSlug);
      localStorage.setItem("maounime_bookmarks", JSON.stringify(filtered));
    }
  },

  async isBookmarked(animeSlug: string): Promise<boolean> {
    const path = `bookmarks/${auth.currentUser?.uid || "unknown"}_${animeSlug}`;
    try {
      if (useFallback) throw new Error("Fallback mode active");
      const user = await getSessionUser();
      const bookmarkId = `${user.uid}_${animeSlug}`;
      const docRef = doc(db, "bookmarks", bookmarkId);
      const snap = await getDoc(docRef);
      return snap.exists();
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.GET, path);
      }
      useFallback = true;
      const localBookmarks = JSON.parse(localStorage.getItem("maounime_bookmarks") || "[]");
      return localBookmarks.some((b: any) => b.animeSlug === animeSlug);
    }
  },

  async getBookmarks(): Promise<Bookmark[]> {
    const path = "bookmarks";
    try {
      if (useFallback) throw new Error("Fallback mode active");
      const user = await getSessionUser();
      const q = query(
        collection(db, "bookmarks"),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const bookmarks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bookmark));
      bookmarks.sort((a, b) => {
        const timeA = a.addedAt?.seconds ? a.addedAt.seconds * 1000 : (a.addedAt ? new Date(a.addedAt).getTime() : 0);
        const timeB = b.addedAt?.seconds ? b.addedAt.seconds * 1000 : (b.addedAt ? new Date(b.addedAt).getTime() : 0);
        return timeB - timeA;
      });
      return bookmarks;
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
      console.warn("getBookmarks Firestore failed, loading locally:", err);
      useFallback = true;
      return JSON.parse(localStorage.getItem("maounime_bookmarks") || "[]");
    }
  },

  // Watch History
  async addToHistory(
    animeSlug: string, 
    animeTitle: string, 
    episodeSlug: string, 
    episodeTitle: string, 
    poster: string
  ): Promise<void> {
    const path = `history/${auth.currentUser?.uid || "unknown"}_${episodeSlug}`;
    try {
      if (useFallback) throw new Error("Fallback mode active");
      const user = await getSessionUser();
      const historyId = `${user.uid}_${episodeSlug}`;
      const docRef = doc(db, "history", historyId);
      
      await setDoc(docRef, {
        userId: user.uid,
        animeSlug,
        animeTitle,
        episodeSlug,
        episodeTitle,
        poster: poster || "",
        watchedAt: serverTimestamp()
      });
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      console.warn("addToHistory Firestore failed, saving locally:", err);
      useFallback = true;
      const user = getFallbackUser();
      const localHistory = JSON.parse(localStorage.getItem("maounime_history") || "[]");
      const filtered = localHistory.filter((h: any) => h.episodeSlug !== episodeSlug);
      filtered.unshift({
        id: `${user.uid}_${episodeSlug}`,
        userId: user.uid,
        animeSlug,
        animeTitle,
        episodeSlug,
        episodeTitle,
        poster: poster || "",
        watchedAt: new Date().toISOString()
      });
      localStorage.setItem("maounime_history", JSON.stringify(filtered));
    }
  },

  async getHistory(maxCount = 20): Promise<WatchHistory[]> {
    const path = "history";
    try {
      if (useFallback) throw new Error("Fallback mode active");
      const user = await getSessionUser();
      const q = query(
        collection(db, "history"),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const history = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WatchHistory));
      history.sort((a, b) => {
        const timeA = a.watchedAt?.seconds ? a.watchedAt.seconds * 1000 : (a.watchedAt ? new Date(a.watchedAt).getTime() : 0);
        const timeB = b.watchedAt?.seconds ? b.watchedAt.seconds * 1000 : (b.watchedAt ? new Date(b.watchedAt).getTime() : 0);
        return timeB - timeA;
      });
      return history.slice(0, maxCount);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
      console.warn("getHistory Firestore failed, loading locally:", err);
      useFallback = true;
      const localHistory = JSON.parse(localStorage.getItem("maounime_history") || "[]");
      return localHistory.slice(0, maxCount);
    }
  },

  async removeHistoryItem(episodeSlug: string): Promise<void> {
    const path = `history/${auth.currentUser?.uid || "unknown"}_${episodeSlug}`;
    try {
      if (useFallback) throw new Error("Fallback mode active");
      const user = await getSessionUser();
      const historyId = `${user.uid}_${episodeSlug}`;
      const docRef = doc(db, "history", historyId);
      await deleteDoc(docRef);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      console.warn("removeHistoryItem Firestore failed, removing locally:", err);
      useFallback = true;
      const localHistory = JSON.parse(localStorage.getItem("maounime_history") || "[]");
      const filtered = localHistory.filter((h: any) => h.episodeSlug !== episodeSlug);
      localStorage.setItem("maounime_history", JSON.stringify(filtered));
    }
  },

  // Comments
  async addComment(episodeSlug: string, text: string, customName?: string): Promise<void> {
    const path = "comments";
    try {
      if (useFallback) throw new Error("Fallback mode active");
      const user = await getSessionUser();
      const displayName = customName || user.displayName || (user.isAnonymous ? "Anonime" : user.email?.split("@")[0]) || "Maounime Fan";
      
      await addDoc(collection(db, "comments"), {
        episodeSlug,
        userId: user.uid,
        userDisplayName: displayName,
        text,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
      console.warn("addComment Firestore failed, saving locally:", err);
      useFallback = true;
      const user = getFallbackUser();
      const displayName = customName || user.displayName || "Lokal User";
      const localComments = JSON.parse(localStorage.getItem(`maounime_comments_${episodeSlug}`) || "[]");
      localComments.unshift({
        id: "local_" + Math.random().toString(36).substring(2, 11),
        episodeSlug,
        userId: user.uid,
        userDisplayName: displayName,
        text,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(`maounime_comments_${episodeSlug}`, JSON.stringify(localComments));
    }
  },

  async getComments(episodeSlug: string): Promise<Comment[]> {
    const path = "comments";
    try {
      if (useFallback) throw new Error("Fallback mode active");
      const q = query(
        collection(db, "comments"),
        where("episodeSlug", "==", episodeSlug)
      );
      const snap = await getDocs(q);
      const comments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      comments.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
      return comments;
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
      console.warn("getComments Firestore failed, loading locally:", err);
      useFallback = true;
      return JSON.parse(localStorage.getItem(`maounime_comments_${episodeSlug}`) || "[]");
    }
  },

  isFallbackActive(): boolean {
    return useFallback;
  },

  setFallbackActive(active: boolean): void {
    useFallback = active;
  }
};
