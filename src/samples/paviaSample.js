import { paviaProject } from '../data/paviaProject.js?v=0.6.3.0';
import { createBlankScenario, PAVIA_DRAFT_SAMPLE } from '../data/scenarioData.js?v=0.6.3.0';

export function createPaviaSampleProject(){
  const project=structuredClone(paviaProject);
  project.sampleId='pavia';
  project.mapSource={kind:'bundled-sample',svg:'projects/pavia/battlefield.svg',terrain:'projects/pavia/pptx-terrain-manifest.json'};
  const scenario=createBlankScenario();
  scenario.metadata={...scenario.metadata,title:'Battle of Pavia',date:'24 February 1525',location:'Mirabello Park, outside Pavia',status:'Sample'};
  scenario.sources=[{id:'pavia-sample-source',name:'Pavia development scenario',type:'bundled sample',status:'sample fixture',textExtract:PAVIA_DRAFT_SAMPLE}];
  project.scenario=scenario;
  return project;
}
