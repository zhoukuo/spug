/**
 * Copyright (c) OpenSpug Organization. https://github.com/openspug/spug
 * Copyright (c) <spug.dev@gmail.com>
 * Released under the AGPL-3.0 License.
 */
import React from "react";
import { observer } from "mobx-react";
import { Modal, Form, Input, Tag, message } from "antd";
import hostStore from "pages/host/store";
import { http } from "libs";
import store from "./store";
import lds from "lodash";

@observer
class Ext3Form extends React.Component {
  constructor(props) {
    super(props);
    console.log(store);
    this.state = {
      loading: false,
      // 当前app已选择主机
      host_ids: [],
      // 当前app的可选主机
      all_app_hosts: [],
    };
  }

  componentDidMount() {
    if (hostStore.records.length === 0) {
      hostStore.fetchRecords();
    }
    // 判断类型,出库
    if (store.type === "outbound") {
      // 出库:只有39/17服务器
      let samePart = store.deploy.host_ids.filter((item) =>
        hostStore.buildIds.includes(item)
      );
      this.setState({
        all_app_hosts: samePart,
        host_ids: samePart,
      });
    } else {
      // 部署deploy
      // 部署:差集
      let difference = store.deploy.host_ids.filter(
        (item) => !hostStore.buildIds.includes(item)
      );
      this.setState({
        all_app_hosts: difference,
        host_ids: difference.length > 0 ? [].concat(difference[0]) : [],
      });
    }
  }

  handleSubmit = async () => {
    const formData = this.props.form.getFieldsValue();
    if (this.state.host_ids.length === 0) {
      return message.error("请至少选择一个要发布的目标主机");
    }
    if (!formData["extra"] || formData["extra"].length === 0) {
      return message.error("请填写版本号");
    }
    this.setState({ loading: true });
    let prefix = "";
    if (store.type === "outbound") {
      prefix = "出库";
    } else {
      prefix = "部署";
    }
    const id = await store.createWorkOrder(
      prefix,
      [formData["extra"]],
      store.deploy.id,
      this.state.host_ids
    );
    await store.deployWorkOrder(id);
    message.success("已执行脚本操作,结果请前往工单详情查看");
    store.ext3Visible = false;
  };

  handleChange = (id, v) => {
    const host_ids = this.state.host_ids;
    const index = host_ids.indexOf(id);
    if (index === -1) {
      this.setState({ host_ids: [id, ...host_ids] });
    } else {
      host_ids.splice(index, 1);
      this.setState({ host_ids });
    }
  };

  render() {
    const info = store.deploy;
    const { host_ids } = this.state;
    const { getFieldDecorator } = this.props.form;
    return (
      <Modal
        visible
        width={800}
        maskClosable={false}
        title="新建发布申请"
        onCancel={() => (store.ext3Visible = false)}
        confirmLoading={this.state.loading}
        onOk={this.handleSubmit}
      >
        <Form labelCol={{ span: 6 }} wrapperCol={{ span: 14 }}>
          <Form.Item
            required
            label="版本号（SPUG_RELEASE）"
            help="可以在自定义脚本中引用该变量，用于设置本次发布相关的动态变量，在脚本中通过 $SPUG_RELEASE 来使用该值。"
          >
            {getFieldDecorator("extra", {
              initialValue:
                store.type === "deploy" ? "latest" : lds.get(info, "extra.0"),
            })(<Input placeholder="请输入版本号 SPUG_RELEASE 的值" />)}
          </Form.Item>
          {store.type === "outbound" ? null : (
            <Form.Item
              required
              label="发布目标主机"
              help="通过点击主机名称自由选择本次发布的主机。"
            >
              {this.state.all_app_hosts.map((id) => (
                <Tag.CheckableTag
                  key={id}
                  checked={host_ids.includes(id)}
                  onChange={(v) => this.handleChange(id, v)}
                >
                  {lds.get(hostStore.idMap, `${id}.name`)}(
                  {lds.get(hostStore.idMap, `${id}.hostname`)}:
                  {lds.get(hostStore.idMap, `${id}.port`)})
                </Tag.CheckableTag>
              ))}
            </Form.Item>
          )}
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(Ext3Form);
