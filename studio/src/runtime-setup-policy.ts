export function shouldOfferInitialSetup(state:{config:unknown;connected:boolean;proxy:boolean;task:{busy:boolean}},dismissed:boolean){
 return !dismissed&&!state.config&&!state.task.busy&&!(state.connected&&state.proxy);
}
