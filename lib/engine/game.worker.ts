import type { WorkerInMessage, WorkerOutMessage } from '../types/protocol';
import { SimulationHost } from './simulationHost';

const host = new SimulationHost((msg: WorkerOutMessage) => {
  self.postMessage(msg);
});

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  host.handleMessage(event.data);
};
