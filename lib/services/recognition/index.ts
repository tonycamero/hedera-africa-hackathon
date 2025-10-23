import { getServiceMode } from '@/lib/config/persona';
import { RecognitionServicePro } from './Recognition.Service.Pro';
class RecognitionServiceGenZ { name='genz'; }
class RecognitionServiceCivic { name='civic'; }
export function getRecognitionService(){
  const mode = getServiceMode('recognition');
  if(mode==='professional') return new RecognitionServicePro();
  if(mode==='hashinal') return new RecognitionServiceGenZ();
  return new RecognitionServiceCivic();
}
