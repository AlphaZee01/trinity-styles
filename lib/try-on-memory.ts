type MemorySession = {
  id: string;
  productId: string;
  userId: string | null;
  personImageUrl: string;
  resultImageUrl: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  runpodJobId: string | null;
  createdAt: number;
  readyAt: number;
};

const sessions = new Map<string, MemorySession>();

export function createMemorySession(input: {
  productId: string;
  userId: string | null;
  personImageUrl: string;
  garmentImageUrl: string;
  runpodJobId?: string | null;
}) {
  const id = crypto.randomUUID();
  const session: MemorySession = {
    id,
    productId: input.productId,
    userId: input.userId,
    personImageUrl: input.personImageUrl,
    resultImageUrl: null,
    status: "processing",
    runpodJobId: input.runpodJobId ?? `stub-${id}`,
    createdAt: Date.now(),
    readyAt: Date.now() + 1800,
  };
  sessions.set(id, session);
  setTimeout(() => {
    const current = sessions.get(id);
    if (!current || current.status !== "processing") return;
    current.status = "completed";
    current.resultImageUrl = input.garmentImageUrl;
  }, 1800);
  return session;
}

export function getMemorySession(id: string) {
  const session = sessions.get(id);
  if (!session) return null;
  if (session.status === "processing" && Date.now() >= session.readyAt && session.resultImageUrl) {
    session.status = "completed";
  }
  return session;
}

export function completeMemorySession(id: string, resultImageUrl: string) {
  const session = sessions.get(id);
  if (!session) return null;
  session.status = "completed";
  session.resultImageUrl = resultImageUrl;
  return session;
}

export function failMemorySession(id: string) {
  const session = sessions.get(id);
  if (!session) return null;
  session.status = "failed";
  return session;
}
