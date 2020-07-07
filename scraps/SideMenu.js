import React from "react";
import { Menu, Popconfirm } from "antd";
import {
  DeleteOutlined,
  AppstoreOutlined,
  MailOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  PlusSquareOutlined,
  SplitCellsOutlined
} from "@ant-design/icons";
import { Avatar } from "antd";

const SideMenu = props => {
  return (
    <Menu
      style={{
        minHeight: "93.4vh",
        maxHeight: "93.4vh",
        overflow: "auto",
        textAlign: "left"
      }}
      defaultSelectedKeys={["1"]}
      defaultOpenKeys={["sub1"]}
      mode="inline"
      theme="dark"
    >
      <Menu.SubMenu key="sub1" icon={<UserOutlined />} title="User profile">
        <Menu.ItemGroup key="g1" title="Test">
          <Menu.Item key="1" onClick={props.showProfile}>
            User data
          </Menu.Item>
          <Menu.Item key="2" onClick={props.showOptions}>
            Privacy options
          </Menu.Item>
        </Menu.ItemGroup>
        <Menu.ItemGroup key="g2" title="Add friends">
          <Menu.Item key="3" onClick={props.showAddFriend}>
            <PlusSquareOutlined />
            Search for new friend with their ID
          </Menu.Item>
          <Menu.Item key="4" onClick={props.generateURL}>
            <SplitCellsOutlined />
            Generate invitation URL
          </Menu.Item>
        </Menu.ItemGroup>
        <Menu.ItemGroup key="g3" title="Your friends">
          {props.friendList.map((friend, index) => (
            <Menu.Item
              onClick={() => props.showChatFriend(friend)}
              key={`friend${index}`}
            >
              <span className="frnd">
                <Avatar src={friend.avatar} /> {friend.name}
              </span>
              <span className="fndDelIc">
                <Popconfirm
                  title={`Remove ${friend.name} from your contacts?`}
                  onConfirm={() => props.friendRemove(friend.proxyID)}
                  okText="Yes"
                  cancelText="No"
                >
                  <DeleteOutlined />
                </Popconfirm>
              </span>
            </Menu.Item>
          ))}
        </Menu.ItemGroup>
      </Menu.SubMenu>

      <Menu.SubMenu key="sub2" icon={<AppstoreOutlined />} title="Rooms">
        <Menu.ItemGroup key="g4" title="Rooms you own">
          <Menu.Item key="6">test</Menu.Item>
          <Menu.Item key="7">pies</Menu.Item>
        </Menu.ItemGroup>
        <Menu.ItemGroup key="g5" title="Public rooms">
          {props.channels.map((channel, index) => (
            <Menu.Item
              key={`ch${index}`}
              onClick={() => props.showRoom(channel.name)}
            >
              <span className="roomNaem">{channel.name}</span>

              <span
                className="listRoomUsersCount"
                title="Users online right now"
              >
                {props.userlist.filter(usr => usr.room === channel.name).length}
                <span className="listDot connected"></span>
              </span>
            </Menu.Item>
          ))}
        </Menu.ItemGroup>
      </Menu.SubMenu>
      <Menu.SubMenu
        key="sub4"
        title={
          <span>
            <SettingOutlined />
            <span>Settings</span>
          </span>
        }
      >
        <Menu.ItemGroup key="g6" title="Theme settings">
          <Menu.Item key="13">Option 9</Menu.Item>
          <Menu.Item key="14">Option 10</Menu.Item>
        </Menu.ItemGroup>
        <Menu.ItemGroup key="g7" title="Other settings">
          <Menu.Item key="15" onClick={props.showRegister}>
            Register
          </Menu.Item>
          <Menu.Item key="16" onClick={props.showLogin}>
            Login
          </Menu.Item>
          <Menu.Item key="17" onClick={props.logOut} icon={<LogoutOutlined />}>
            Log out
          </Menu.Item>
        </Menu.ItemGroup>
      </Menu.SubMenu>
    </Menu>
  );
};

export default SideMenu;

.filter(ms => ms.room === this.props.friend.proxyID)
.map((mes, index, arr) => {
  if (arr[index - 1] && mes.sender === arr[index - 1].sender) {
    mes.order = true;
  } else {
    mes.order = false;
  }
  return mes;
})
.map(mes => (
  <ConversationPiece
    showImage={this.showImage}
    key={mes.key}
    author={mes.author === mes.sender ? "You" : mes.author}
    text={mes.text}
    date={mes.date}
    color={mes.color}
    order={mes.order}
    image={mes.image}
    index={mes.index}
  />
))
.reverse()
