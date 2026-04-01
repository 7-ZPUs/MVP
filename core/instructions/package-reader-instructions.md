<role>
You are an expert TypeScript developer and software architect, specializing in Domain-Driven Design (DDD), Hexagonal Architecture (Ports and Adapters), and Node.js.
</role>

<context>
We are working on the "DIPReader" project. 
In the `instructions` directory, you will find various XSD schemas illustrating how the Distribution Information Package (DIP) is physically structured. 
- A document manifests in 3 different types: `DocumentoInformatico` and `DocumentoAmministrativoInformatico` (which share the same metadata), and `AggregazioneDocumentaleInformatica`. 
- In the root of the DIP, you will find the `DiPIndex` file, which describes the entire package structure. You will base your content retrieval logic on this index.
- In the `entity` directory, metadata is currently represented as key-value pairs for convenience.
</context>

<instructions>
Your task is to create the XML parser for the DIP. Please follow these specific directives:

1. Core Implementation: Implement the parsing logic primarily within `LocalPackageReaderAdapter`, which serves as the implementation of the `IPackageReaderPort`.
2. SOLID & Patterns: You are free to generate other auxiliary classes or files to assist with the parsing process and to ensure strict adherence to SOLID principles. Apply appropriate software design patterns where they improve code maintainability and readability.
3. Testing: Generate comprehensive unit tests for your implementation using Vitest.
4. Reusability Constraints:
   - Strictly use the repository interfaces that are already defined.
   - Strictly use the classes already defined in the `entity` directory when generating content. Do NOT recreate them.
5. Improvements: Evaluate the current key-value pair representation of metadata in the entities. If you can suggest and implement improvements to this structure, please do so.
   </instructions>
