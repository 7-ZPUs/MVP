import { Dip } from "../../../entity/Dip";
import { DocumentClass } from "../../../entity/DocumentClass";
import { Process } from "../../../entity/Process";
import { Document } from "../../../entity/Document";
import { File } from "../../../entity/File";

export const DATA_MAPPER_TOKEN = Symbol("IDataMapper");

export interface MapperRequest<T> {
  metadataRelativePath: string | null;
  map: (rawMetadata: any) => T;
}

export interface IDataMapper {
  mapDip(): Dip;
  mapDocumentClasses(): DocumentClass[];
  getProcessMappers(): MapperRequest<Process>[];
  getDocumentMappers(): MapperRequest<Document>[];
  getFileMappers(): MapperRequest<File>[];
  setRawDipIndex(rawDipIndex: any): void;
}
