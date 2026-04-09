import { MetadataExtractor } from './src/app/shared/utils/metadata-extractor.util';

const data = [
  {
    name: 'TipoRegistro',
    value: [
      {
        name: 'ProtocolloOrdinario_ProtocolloEmergenza',
        value: [
          { name: 'TipoRegistro', value: 'ProtocolloOrdinario\\ProtocolloEmergenza' },
          { name: 'DataProtocollazioneDocumento', value: '2023-11-23' }
        ]
      }
    ]
  }
];

const extractor = new MetadataExtractor(data);
console.log('getString:', extractor.getString('TipoRegistro'));
