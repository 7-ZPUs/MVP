import "reflect-metadata";
import { container } from "tsyringe";

// ---- Services ----

// ---- Repositories ----
import { PACKAGE_READER_PORT_TOKEN } from "./repo/IPackageReaderPort";
import { LocalPackageReaderAdapter } from "./repo/impl/LocalPackageReaderAdapter";
import { DIP_INDEX_PARSER_TOKEN } from "./repo/impl/utils/IDipParser";
import { XmlDipParser } from "./repo/impl/utils/XmlDipParser";
import { FileSystemProvider } from "./repo/impl/utils/FileSystemProvider";

// ---- Document use cases ----

// ---- Process use cases ----
import { INDEX_DIP_TOKEN } from "./use-case/utils/indexing/IIndexDip";
import { IndexDip } from "./use-case/utils/indexing/impl/IndexDip";

// Services

// Repositories

// Package reader
container.register(DIP_INDEX_PARSER_TOKEN, { useClass: XmlDipParser });
container.register(FileSystemProvider, { useClass: FileSystemProvider });
container.register(PACKAGE_READER_PORT_TOKEN, {
  useFactory: (dependencyContainer) =>
    new LocalPackageReaderAdapter(
      dependencyContainer.resolve(DIP_INDEX_PARSER_TOKEN),
      dependencyContainer.resolve(FileSystemProvider),
    ),
});

// Documento use cases

// File use cases

// Process use cases

// Indexing use cases
container.register(INDEX_DIP_TOKEN, { useClass: IndexDip });
container.register(DIP_INDEX_PARSER_TOKEN, { useClass: XmlDipParser });

export { container } from "tsyringe";
