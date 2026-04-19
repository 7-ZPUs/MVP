import { Vector } from "../../../src/entity/Vector";
import { VectorPersistenceAdapter } from "../../../src/repo/impl/VectorPersistenceAdapter";

describe("VectorPersistenceAdapter", () => {
  it("should call DAO save() method without altering the Vector object", async () => {
    const mockDAO = {
      save: vi.fn(),
      getByDocumentId: vi.fn(),
      searchSimilar: vi.fn(),
    };

    const repository = new VectorPersistenceAdapter(mockDAO);
    const vector = new Vector(1, new Float32Array([0.1, 0.2, 0.3]));

    await repository.saveVector(vector);

    expect(mockDAO.save).toHaveBeenCalledWith(vector);
  });

  it("should throw error on null Vector object", async () => {
    const mockDAO = {
      save: vi.fn(),
      getByDocumentId: vi.fn(),
      searchSimilar: vi.fn(),
    };

    const repository = new VectorPersistenceAdapter(mockDAO);

    // @ts-expect-error - intentionally passing null to test error handling
    await expect(repository.saveVector(null)).rejects.toThrow();
  });

  it("should call dao.getByDocumentId() and return embedding", async () => {
    const mockDAO = {
      save: vi.fn(),
      getByDocumentId: vi
        .fn()
        .mockReturnValue(new Vector(1, new Float32Array([0.1, 0.2, 0.3]))),
      searchSimilar: vi.fn(),
    };

    const repository = new VectorPersistenceAdapter(mockDAO);
    const result = await repository.getVector(1);

    expect(mockDAO.getByDocumentId).toHaveBeenCalledWith(1);
    expect(result).toEqual(new Float32Array([0.1, 0.2, 0.3]));
  });

  it("should call dao.getByDocumentId() and return null if vector not found", async () => {
    const mockDAO = {
      save: vi.fn(),
      getByDocumentId: vi.fn().mockReturnValue(null),
      searchSimilar: vi.fn(),
    };

    const repository = new VectorPersistenceAdapter(mockDAO);
    const result = await repository.getVector(1);

    expect(mockDAO.getByDocumentId).toHaveBeenCalledWith(1);
    expect(result).toBeNull();
  });

  it("should call dao.getVector with correct documentId and return results", async () => {
    const expectedVector = new Float32Array([0.1, 0.2, 0.3]);
    const mockDAO = {
      save: vi.fn(),
      getByDocumentId: vi.fn().mockReturnValue(new Vector(1, expectedVector)),
      searchSimilar: vi.fn(),
    };

    const repository = new VectorPersistenceAdapter(mockDAO);
    const documentId = 1;
    const result = await repository.getVector(documentId);

    expect(mockDAO.getByDocumentId).toBeCalledWith(1);
    expect(result).toEqual(expectedVector);
  });

  it("should call dao.searchSimilar with correct parameters and return results", async () => {
    const mockDAO = {
      save: vi.fn(),
      getByDocumentId: vi.fn(),
      searchSimilar: vi.fn().mockReturnValue([
        { documentId: 1, score: 0.9 },
        { documentId: 2, score: 0.8 },
      ]),
    };

    const repository = new VectorPersistenceAdapter(mockDAO);
    const queryVector = new Float32Array([0.1, 0.2, 0.3]);
    const topK = 2;
    const result = await repository.searchSimilarVectors(queryVector, topK);

    expect(mockDAO.searchSimilar).toBeCalledWith(queryVector, topK);
    expect(result).toEqual([
      { documentId: 1, score: 0.9 },
      { documentId: 2, score: 0.8 },
    ]);
  });
});
