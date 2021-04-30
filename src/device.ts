import { API } from 'homebridge';

export class Device {
  public readonly uuid: string;

  constructor(
      public readonly api: API,
      public kind: string,
      public id: string,
      public name: string,
  ) {
    this.uuid = this.api.hap.uuid.generate(kind + id);
  }
}