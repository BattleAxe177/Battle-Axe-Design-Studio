import { runPlaytest, runBatch } from './playtestEngine.js?v=0.6.5.0';
self.onmessage=(event)=>{
  const {id,kind,state,settings}=event.data||{};
  try{
    const result=kind==='single'?runPlaytest(state,settings||{}):kind==='batch'?runBatch(state,settings||{}):(()=>{throw new Error(`Unknown playtest request: ${kind}`)})();
    self.postMessage({id,ok:true,kind,result});
  }catch(error){
    self.postMessage({id,ok:false,kind,error:{message:error?.message||String(error),code:error?.code||'BAX_SIMULATION_ERROR',diagnostic:error?.diagnostic||null}});
  }
};
