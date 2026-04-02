import { MetadataFilter } from "../../../../shared/domain/metadata";

export class MetadataKeyMapper {
  static toPascalCase(key: string): string {
    // Gestisce snake_case (e.g. metadata_key) o camelCase (e.g. metadataKey) -> PascalCase (e.g. MetadataKey)
    return key
      .split(/_/)
      .map(part => {
        if (!part) return part;
        // Capitalizza la prima lettera del segmento underscore
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join("")
      .replace(/([a-z])([A-Z])/g, '$1$2') // caso in cui era già camelCase: metadataKey (M->M) niente di speciale
      // Aspetta, split('_') risolve metadata_key ma NON metadataKey.
      // Esempio:
      // "metadata_key" -> "MetadataKey"
      // "metadataKey" -> "MetadataKey"
      // "nome" -> "Nome"
      ;
  }

  static mapFilters(filters: MetadataFilter[]): MetadataFilter[] {
    return filters.map(f => ({
      key: MetadataKeyMapper.toPascalCase(f.key),
      value: f.value
    }));
  }
}

function _advancedToPascalCase(key: string): string {
    // Sostituiamo underscore con spazio
    let result = key.replace(/_/g, " ");
    
    // Assicuriamoci che camelCase sia diviso da spazi prima? No, l'esempio vuole che se entra metadataKey -> MetadataKey.
    // metadata_key -> MetadataKey.
    
    // Gestione unificata: 
    // se contiene "_" split per _
    // altrimenti (è camelCase o flat) assicura solo la prima lettera maiuscola (PascalCase vero e proprio)

    const parts = key.split(/_+/);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

// Override function with better version:
MetadataKeyMapper.toPascalCase = _advancedToPascalCase;
