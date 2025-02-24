import { events } from './platformReactNative.events'
import { isOnline } from './platformReactNative.isOnline'
import { storage } from './platformReactNative.storage'
import PouchDB from './pouchdb'

export const platformReactNative = {
  storage,
  events,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  pouchAdapter: PouchDB,
  isOnline
}
