evilPortScanner
===============

Massive TCP port scanner.

Work in progress :
* DONE: implement connection refused
* DONE: implement connection timeout
* DONE: implement connection success for verbose ports (telnet, ftp, ssh, ..)
* TODO: implement connection success for non verbose ports (http, rpc, dns, ..) 
* IN PROGRESS: output formater (json, xml, console)

Usage
==============

```
root@debian:/home/evil/portscanner# ./scan.js --target=127.0.0.1 --ports=0-65535 --banner --isopen --istimeout
127.0.0.1:111|close (timeout)
127.0.0.1:81|close (timeout)
127.0.0.1:53|close (timeout)
127.0.0.1:23|open|Debian GNU/Linux jessie/sid\r\ndebian login:
127.0.0.1:5432|close (timeout)
127.0.0.1:27017|close (timeout)
127.0.0.1:28017|close (timeout)
127.0.0.1:34170|close (timeout)
127.0.0.1:52988|close (timeout)
127.0.0.1:59725|close (timeout)
```

