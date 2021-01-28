/**
 * Copyright (c) OpenSpug Organization. https://github.com/openspug/spug
 * Copyright (c) <spug.dev@gmail.com>
 * Released under the AGPL-3.0 License.
 */
import { observable } from "mobx";
import http from 'libs/http';

class Store {
  @observable records = {};
  @observable record = {};
  @observable deploy = {};
  @observable page = 0;
  @observable loading = {};
  @observable isReadOnly = false;
  @observable isFetching = false;
  @observable formVisible = false;
  @observable addVisible = false;
  @observable ext1Visible = false;
  @observable ext2Visible = false;
  @observable ext3Visible = false;
  // 标记type: deploy,outbound
  // 构建,部署
  @observable type = '';

  @observable f_name;
  @observable f_desc;

  fetchRecords = () => {
    this.isFetching = true;
    http.get('/api/app/')
      .then(res => {
        const tmp = {};
        for (let item of res) {
          tmp[item.id] = item
        }
        this.records = tmp
      })
      .finally(() => this.isFetching = false)
  };

  loadDeploys = (app_id) => {
    return http.get('/api/app/deploy/', {params: {app_id}})
      .then(res => this.records[app_id]['deploys'] = res)
  };

  showForm = (e, info) => {
    if (e) e.stopPropagation();
    this.record = info || {};
    this.formVisible = true;
  };

  showExtForm = (e, app_id, info, isClone, isReadOnly = false) => {
    if (e) e.stopPropagation();
    this.page = 0;
    this.app_id = app_id;
    this.isReadOnly = isReadOnly
    if (info) {
      if (info.extend === '1') {
        this.ext1Visible = true
      } else {
        this.ext2Visible = true
      }
      isClone && delete info.id;
      this.deploy = info
    } else {
      this.addVisible = true;
    }
  };
  showExtForm3 = (e, app_id, info, isClone, isReadOnly = false,type) => {
    if (e) e.stopPropagation();
    this.page = 0;
    this.app_id = app_id;
    this.isReadOnly = isReadOnly;
    this.ext3Visible = true;
    isClone && delete info.id;
    this.deploy = info
    this.type = type;
  };

  addHost = () => {
    this.deploy['host_ids'].push(undefined)
  };

  editHost = (index, v) => {
    this.deploy['host_ids'][index] = v
  };

  delHost = (index) => {
    this.deploy['host_ids'].splice(index, 1)
  }

  // 创建工单
  /**
   * 
   * @param {*} title 应用名称
   * @param {*} deploy_id 应用id
   * @param {*} host_ids 目标主机
   */
  createWorkOrder = async (title, extra, deploy_id, host_ids)=>{
    let params = {
      // 标题
      name: title,
      // 额外参数
      extra:extra,
      // 发布模式的id
      deploy_id:deploy_id, 
      // 目标主机id(在医网信中不同id的脚本不一样)
      host_ids:host_ids
    }
    const {id} = await http.post('/api/deploy/request/', params)
    return id;
  }


  // 发布工单
  deployWorkOrder = async (id)=>{
    // 先获取当前工单的id
    await http.post('/api/deploy/request/'+ id+'/')
  }
}

export default new Store()
