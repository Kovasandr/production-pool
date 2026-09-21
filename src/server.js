import {JsonStateStore} from './store.js';
import {PostgresStateStore} from './postgres-store.js';
import {createProductionPoolServer} from './http.js';

const secret=process.env.SHOPIFY_API_SECRET;
if (!secret) throw new Error('SHOPIFY_API_SECRET is required');
const store=process.env.DATABASE_URL
  ? new PostgresStateStore(process.env.DATABASE_URL)
  : new JsonStateStore(process.env.STATE_FILE || './data/state.json');
if(process.env.NODE_ENV==='production' && !process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in production');
const initialState={materials:{},boms:{},processedOrders:{},processedWebhooks:{}};
const port=Number(process.env.PORT || 3000);
const server=createProductionPoolServer({secret,store,initialState});
server.listen(port,()=>console.log(`Production Pool listening on ${port}`));
let stopping=false;
async function shutdown(signal){
  if(stopping) return; stopping=true; console.log(`${signal}: shutting down`);
  server.close(async ()=>{ try{ if(typeof store.close==='function') await store.close(); } finally { process.exit(0); } });
  setTimeout(()=>process.exit(1),10000).unref();
}
process.on('SIGTERM',()=>shutdown('SIGTERM'));
process.on('SIGINT',()=>shutdown('SIGINT'));
