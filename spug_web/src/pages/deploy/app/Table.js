/**
 * Copyright (c) OpenSpug Organization. https://github.com/openspug/spug
 * Copyright (c) <spug.dev@gmail.com>
 * Released under the AGPL-3.0 License.
 */
import React from "react";
import { toJS } from "mobx";
import { observer } from "mobx-react";
import { Table, Modal, Tag, Icon, message } from "antd";
import { http, hasPermission } from "libs";
import store from "./store";
import { Action } from "components";
import CloneConfirm from "./CloneConfirm";
import envStore from "pages/config/environment/store";
import lds from "lodash";
import hostStore from "pages/host/store";
@observer
class ComTable extends React.Component {
  constructor(props) {
    super(props);
    this.cloneObj = null;
    this.type = {
      deploy: "deploy",
      outbound: "outbound",
    };
  }

  componentDidMount() {
    store.fetchRecords();
    if (envStore.records.length === 0) {
      envStore.fetchRecords();
    }
    if (hostStore.records.length === 0) {
      hostStore.fetchRecords();
    }
  }

  handleClone = (e, id) => {
    e.stopPropagation();
    this.cloneObj = null;
    Modal.confirm({
      icon: "exclamation-circle",
      title: "选择克隆对象",
      content: <CloneConfirm onChange={(v) => (this.cloneObj = v[1])} />,
      onOk: () => {
        if (!this.cloneObj) {
          message.error("请选择目标应用及环境");
          return Promise.reject();
        }
        const info = JSON.parse(this.cloneObj);
        info.env_id = undefined;
        store.showExtForm(null, id, info, true);
      },
    });
  };

  handleDelete = (e, text) => {
    e.stopPropagation();
    Modal.confirm({
      title: "删除确认",
      content: `确定要删除应用【${text["name"]}】?`,
      onOk: () => {
        return http
          .delete("/api/app/", { params: { id: text.id } })
          .then(() => {
            message.success("删除成功");
            store.fetchRecords();
          });
      },
    });
  };

  handleDeployDelete = (text) => {
    Modal.confirm({
      title: "删除确认",
      content: `删除发布配置将会影响基于该配置所创建发布申请的发布和回滚功能，确定要删除【${lds.get(
        envStore.idMap,
        `${text.env_id}.name`
      )}】的发布配置?`,
      onOk: () => {
        return http
          .delete("/api/app/deploy/", { params: { id: text.id } })
          .then(() => {
            message.success("删除成功");
            store.loadDeploys(text.app_id);
          });
      },
    });
  };
  // 构建
  handleBuild = async (e, id, info) => {
    // hostStore.buildIds和host_ids存在交集
    let samePart = info.host_ids.filter((item) =>
      hostStore.buildIds.includes(item)
    );
    if (samePart.length < 1) {
      message.error("不存在构建服务器39/17,构建失败");
      return;
    }
    this.setState({ loading: true });
    // 建工单
    const tmpId = await store.createWorkOrder(
      "构建",
      [null],
      info.deploy_id,
      samePart
    );
    // 发布
    await store.deployWorkOrder(tmpId);
    message.success("已执行脚本操作,结果请前往工单详情查看");
    this.setState({ loading: false });
  };
  // 部署
  handleDeploy = (e, id, info) => {
    // 查看是否有除构建机器以外的机器
    let difference = info.host_ids.filter(
      (item) => !hostStore.buildIds.includes(item)
    );
    if (difference.length < 1) {
      message.error(
        "不存在构建服务器39/17以外的机器,无法部署,请添加目标服务器"
      );
    } else {
      // 弹窗新建工单,移除构建机器
      store.showExtForm3(e, id, info, false, false, this.type.deploy);
    }
  };
  // 构建并部署
  handleBuildAndDeploy = async (e, id, info) => {
    this.setState({ loading: true });
    // 建工单
    const tmpId = await store.createWorkOrder(
      "构建并部署",
      ['latest'],
      info.deploy_id,
      info.host_ids
    );
    // 发布
    await store.deployWorkOrder(tmpId);
    message.success("已执行脚本操作,结果请前往工单详情查看");
    this.setState({ loading: false });
  };
  // 出库
  handleRelease = (e, id, info) => {
    let samePart = info.host_ids.filter((item) =>
      hostStore.buildIds.includes(item)
    );
    if (samePart.length < 1) {
      message.error("不存在构建服务器39/17,出库失败");
      return;
    }
    // 弹窗出库
    store.showExtForm3(e, id, info, false, false, this.type.outbound);
  };

  expandedRowRender = (record) => {
    if (record["deploys"] === undefined) {
      store.loadDeploys(record.id);
    }
    return (
      <Table
        rowKey="id"
        loading={record["deploys"] === undefined}
        dataSource={record["deploys"]}
        pagination={false}
      >
        <Table.Column
          width={80}
          title="模式"
          dataIndex="extend"
          render={(value) =>
            value === "1" ? (
              <Icon
                style={{ fontSize: 20, color: "#1890ff" }}
                type="ordered-list"
              />
            ) : (
              <Icon style={{ fontSize: 20, color: "#1890ff" }} type="build" />
            )
          }
        />
        <Table.Column
          title="发布环境"
          dataIndex="env_id"
          render={(value) => lds.get(envStore.idMap, `${value}.name`)}
        />
        <Table.Column
          title="关联主机"
          dataIndex="host_ids"
          render={(value) => `${value.length} 台`}
        />
        <Table.Column
          title="发布审核"
          dataIndex="is_audit"
          render={(value) =>
            value ? <Tag color="green">开启</Tag> : <Tag color="red">关闭</Tag>
          }
        />
        {hasPermission("deploy.app.config|deploy.app.edit") && (
          <Table.Column
            title="操作"
            render={(info) => (
              <Action>
                <Action.Button
                  auth="deploy.app.config"
                  onClick={(e) => this.handleBuild(e, record.id, info)}
                >
                  构建
                </Action.Button>
                <Action.Button
                  auth="deploy.app.config"
                  onClick={(e) => this.handleDeploy(e, record.id, info)}
                >
                  部署
                </Action.Button>
                <Action.Button
                  auth="deploy.app.config"
                  onClick={(e) => this.handleRelease(e, record.id, info)}
                >
                  出库
                </Action.Button>
                <Action.Button
                  auth="deploy.app.config"
                  onClick={(e) =>
                    store.showExtForm(e, record.id, info, false, true)
                  }
                >
                  查看
                </Action.Button>
                <Action.Button
                  auth="deploy.app.edit"
                  onClick={(e) => store.showExtForm(e, record.id, info)}
                >
                  编辑
                </Action.Button>
                <Action.Button
                  auth="deploy.app.edit"
                  onClick={() => this.handleDeployDelete(info)}
                >
                  删除
                </Action.Button>
                <Action.Button
                  auth="deploy.app.config"
                  onClick={(e) => this.handleBuildAndDeploy(e, record.id, info)}
                >
                  构建并部署
                </Action.Button>
              </Action>
            )}
          />
        )}
      </Table>
    );
  };

  render() {
    let data = Object.values(toJS(store.records));
    if (store.f_name) {
      data = data.filter((item) =>
        item["name"].toLowerCase().includes(store.f_name.toLowerCase())
      );
    }
    if (store.f_desc) {
      data = data.filter(
        (item) =>
          item["desc"] &&
          item["desc"].toLowerCase().includes(store.f_desc.toLowerCase())
      );
    }

    return (
      <Table
        rowKey="id"
        expandRowByClick
        loading={store.isFetching}
        dataSource={data}
        expandedRowRender={this.expandedRowRender}
        pagination={{
          showSizeChanger: true,
          showLessItems: true,
          hideOnSinglePage: true,
          showTotal: (total) => `共 ${total} 条`,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
      >
        <Table.Column
          width={80}
          title="序号"
          key="series"
          render={(_, __, index) => index + 1}
        />
        <Table.Column title="应用名称" dataIndex="name" />
        <Table.Column title="标识符" dataIndex="key" />
        <Table.Column ellipsis title="描述信息" dataIndex="desc" />
        {hasPermission("deploy.app.edit|deploy.app.del") && (
          <Table.Column
            width={260}
            title="操作"
            render={(info) => (
              <Action>
                <Action.Button
                  auth="deploy.app.edit"
                  onClick={(e) => store.showExtForm(e, info.id)}
                >
                  新建发布
                </Action.Button>
                <Action.Button
                  auth="deploy.app.edit"
                  onClick={(e) => this.handleClone(e, info.id)}
                >
                  克隆发布
                </Action.Button>
                <Action.Button
                  auth="deploy.app.edit"
                  onClick={(e) => store.showForm(e, info)}
                >
                  编辑
                </Action.Button>
                <Action.Button
                  auth="deploy.app.del"
                  onClick={(e) => this.handleDelete(e, info)}
                >
                  删除
                </Action.Button>
              </Action>
            )}
          />
        )}
      </Table>
    );
  }
}

export default ComTable;
