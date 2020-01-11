import {
  Accessory,
  LightService,
  POWERMODE_HSV,
  POWERMODE_CT,
  convertColorTemperature,
  powerModeFromColorModeAndActiveMode,
  Attributes
} from "./lightservice";
import { Configuration } from "homebridge";
import { Light } from "./light";

export class BackgroundLightService extends LightService {
  service: any;
  homebridge: any;
  lastHue: any;
  lastSat: any;
  constructor(
    log: (message?: any, ...optionalParams: any[]) => void,
    config: Configuration,
    light: Light,
    homebridge: any,
    accessory: Accessory
  ) {
    super(log, config, light, homebridge, accessory, "background");
    this.service.displayName = "Background Light";
    this.installHandlers();
  }

  private async installHandlers() {
    this.handleCharacteristic(
      this.homebridge.hap.Characteristic.On,
      async () => (await this.attributes()).bg_power,
      value => this.sendCommand("bg_set_power", [value ? "on" : "off", "smooth", 500, POWERMODE_HSV])
    );
    this.handleCharacteristic(
      this.homebridge.hap.Characteristic.Brightness,
      async () => (await this.attributes()).bg_bright,
      value => this.sendSuddenCommand("bg_set_bright", value)
    );
    this.handleCharacteristic(
      this.homebridge.hap.Characteristic.Hue,
      async () => (await this.attributes()).bg_hue,
      async value => {
        this.lastHue = value;
        this.setHSV("bg_");
      }
    );
    this.handleCharacteristic(
      this.homebridge.hap.Characteristic.Saturation,
      async () => (await this.attributes()).bg_sat,
      async value => {
        this.lastSat = value;
        this.setHSV("bg_");
      }
    );
    const characteristic = await this.handleCharacteristic(
      this.homebridge.hap.Characteristic.ColorTemperature,
      async () => {
        this.ensurePowerMode(POWERMODE_CT, "bg_");
        return convertColorTemperature((await this.attributes()).bg_ct);
      },
      value => {
        this.ensurePowerMode(POWERMODE_CT, "bg_");
        this.sendSuddenCommand("set_ct_abx", convertColorTemperature(value));
      }
    );
    characteristic.setProps({
      ...characteristic.props,
      maxValue: convertColorTemperature(this.specs.colorTemperature.min),
      minValue: convertColorTemperature(this.specs.colorTemperature.max)
    });
  }

  public onAttributesUpdated = (newAttributes: Attributes) => {
    this.powerMode = powerModeFromColorModeAndActiveMode(newAttributes.bg_lmode, 0);
  };
}