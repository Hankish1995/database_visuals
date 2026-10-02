import type { Concept } from "@/content/concepts";

// The HNSW lesson's glossary, shown in the inspector. PostgreSQL itself has
// no vector type or HNSW index; both come from the pgvector extension
// (HNSW since pgvector 0.5.0). Facts below are pgvector's documented
// behaviour; the demo itself is a simplified simulation.
export type VectorConceptId = "embedding" | "distance" | "ann" | "hnsw" | "efSearch" | "recall" | "tradeoff";

export const VECTOR_CONCEPT_ORDER: VectorConceptId[] = ["efSearch", "hnsw", "embedding", "distance", "ann", "recall", "tradeoff"];

export const VECTOR_CONCEPTS: Record<VectorConceptId, Concept & { short: string }> = {
  embedding: {
    short: "Embeddings", name: "Vector embeddings", tagline: "Meaning as numbers",
    question: "What is a vector embedding?",
    definition: "A list of numbers that a model produces to represent something -- a sentence, an image, a product -- so that similar things get similar lists. Stored in a pgvector column such as embedding vector(1536).",
    purpose: ["Semantic search: find text that means the same, not just matching words", "Recommendations and deduplication", "Retrieval for AI assistants (RAG)"],
    caveat: "This demo uses 2 dimensions so vectors can be drawn as points; real embeddings have hundreds or thousands.",
  },
  distance: {
    short: "Distance", name: "Similarity and distance", tagline: "How close two vectors are",
    question: "How is similarity measured?",
    definition: "As a distance between vectors: the smaller, the more similar. pgvector supports L2 (Euclidean) distance with <->, cosine distance with <=>, and negative inner product with <#>. The demo uses L2 distance.",
    purpose: ["ORDER BY embedding <-> query LIMIT k asks for the k nearest", "An HNSW index is built for one distance (its operator class, e.g. vector_l2_ops)", "Queries must use the matching operator to use the index"],
  },
  ann: {
    short: "ANN search", name: "Approximate nearest-neighbor search", tagline: "Fast, nearly exact",
    question: "What is approximate nearest-neighbor search?",
    definition: "Finding vectors that are very likely among the nearest, without comparing the query against every row. An exact search computes every distance -- simple, but its cost grows with the table. An ANN index trades a little accuracy for much less work.",
    purpose: ["Exact: a sequential scan + sort, always correct", "Approximate: an HNSW or IVFFlat index, usually much faster on large tables", "Results can differ from the exact answer"],
    caveat: "With an approximate index, adding a WHERE filter can return fewer rows than LIMIT asks for, because filtering happens after the index scan.",
  },
  hnsw: {
    short: "HNSW layers", name: "HNSW graph", tagline: "Hierarchical Navigable Small World",
    question: "How is an HNSW index organized?",
    definition: "As a graph: each vector is linked to some of its near neighbours. The graph has layers -- every vector is on layer 0, and a shrinking, random subset is also on each layer above. Search starts at the top layer's entry point, greedily moves toward the query, and drops a layer at a time to the dense bottom layer.",
    purpose: ["Upper layers have few, long links: a quick route into the right region", "Layer 0 has every vector and short links: the detailed search", "Build settings m (links per vector, default 16) and ef_construction (default 64) shape the graph"],
    caveat: "Building an HNSW index is slower and uses more memory than IVFFlat, in exchange for a better speed-recall tradeoff.",
  },
  efSearch: {
    short: "ef_search", name: "ef_search", tagline: "Size of the candidate list",
    question: "What does ef_search control?",
    definition: "How many candidates the search keeps on the bottom layer while it explores. A bigger list keeps more promising vectors in play, so the search explores further before it stops. In pgvector it is a runtime setting: SET hnsw.ef_search = 100; (default 40). It can be changed per session or per transaction without rebuilding the index.",
    purpose: ["Larger: usually higher recall, more distances computed", "Smaller: less work, more risk of missing a closer vector", "An index scan returns at most ef_search rows, unless iterative index scans (pgvector 0.8.0+) are turned on"],
    caveat: "Its effect depends on the data, the index's m and ef_construction, the pgvector version and the hardware. The demo's 5–32 range is scaled down for a 48-vector graph.",
  },
  recall: {
    short: "Recall", name: "Recall", tagline: "How many true neighbours were found",
    question: "What is recall?",
    definition: "The share of the true k nearest neighbours that the approximate search returned. If the exact top 5 are A, B, C, D, E and the index returns A, B, C, D, F, recall is 4 of 5 = 80%.",
    purpose: ["Measured against an exact search on the same data", "Usually reported as an average over many test queries", "100% on one query doesn't guarantee 100% on the next"],
  },
  tradeoff: {
    short: "Tradeoff", name: "Speed versus recall", tagline: "More work, better answers -- usually",
    question: "What is the speed-recall tradeoff?",
    definition: "Raising ef_search makes the search examine more vectors: recall tends to rise and so does the work per query. Past a point, recall stops improving while the work keeps growing. The right setting is the smallest one that gives the recall your application needs, found by measuring on your own data.",
    purpose: ["Compare against an exact search on a sample of real queries", "Raise ef_search until recall is good enough", "Watch latency at your expected load"],
    caveat: "The work and recall numbers in this lesson are illustrative counts from a tiny graph, not PostgreSQL benchmarks.",
  },
};
