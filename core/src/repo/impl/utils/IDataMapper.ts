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
  mapDip(rawDipIndex: any): Dip;
  mapDocumentClasses(rawDipIndex: any): DocumentClass[];
  getProcessMappers(rawDipIndex: any): MapperRequest<Process>[];
  getDocumentMappers(rawDipIndex: any): MapperRequest<Document>[];
  getFileMappers(rawDipIndex: any): MapperRequest<File>[];
}
