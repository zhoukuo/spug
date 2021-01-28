/**
 * Copyright (c) OpenSpug Organization. https://github.com/openspug/spug
 * Copyright (c) <spug.dev@gmail.com>
 * Released under the AGPL-3.0 License.
 */
import { observable } from "mobx";
import http from 'libs/http';

class Store {
  @observable records = [];
  @observable zones = [];
  @observable permRecords = [];
  // 构建用的机子id
  @observable buildIds = [];
  @observable record = {};
  @observable idMap = {};
  @observable isFetching = false;
  @observable formVisible = false;
  @observable importVisible = false;
  

  @observable f_name;
  @observable f_zone;
  @observable f_host;

  fetchRecords = () => {
    let buildIps = ['192.168.126.39','192.168.1.17'];
    this.isFetching = true;
    return http.get('/api/host/')
      .then(({hosts, zones, perms}) => {
        this.records = hosts;
        let tmp = [];
        // 设置buildIds 
        hosts.forEach(element => {
          if(buildIps.indexOf(element.hostname) !== -1) {
            tmp.push(element.id);
          }
        });
        this.buildIds = tmp;
        this.zones = zones;
        this.permRecords = hosts.filter(item => perms.includes(item.id));
        for (let item of hosts) {
          this.idMap[item.id] = item
        }
      })
      .finally(() => this.isFetching = false)
  };

  showForm = (info = {}) => {
    this.formVisible = true;
    this.record = info
  }
}

export default new Store()
