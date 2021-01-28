## 初始化虚拟环境
```
python3 -m venv venv
```

## 进入虚拟环境
```
source venv/bin/activate
``` 

## 下载依赖
```
pip install -r requirements.txt -i https://pypi.doubanio.com/simple/
```

## 创建默认管理员账户
```
python manage.py useradd -u admin -p spug.dev -s -n 管理员
# -u 用户名
# -p 密码
# -s 超级管理员
# -n 用户昵称
```

## 启动
```
python manage.py runserver
```