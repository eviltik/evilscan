evilPortScanner
===============

Massive TCP port scanner.

Work in progress :
* DONE: implement connection refused
* DONE: implement connection timeout
* DONE: implement connection success for verbose ports (telnet, ftp, ssh, ..)
* TODO: implement connection success for non verbose ports (http, rpc, dns, ..) 
* DONE: optional progress indicator
* DONE: optional geoip (country,city,longitude,latitude)
* IN PROGRESS: output formater (json, xml, console)

Example usage
==============

Every ports on localhost, grab banner, display only opened or timeouted ports
```
root@debian:~# ./scan.js --target=127.0.0.1 --ports=0-65535 --banner --isopen --istimeout
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

Every ports on localhost, grab banner, display only opened or timeouted ports, json output, progress status each seconds
```
root@debian:~# ./scan.js --target=127.0.0.1 --ports=0-65535 --banner --isopen --istimeout --progress --json
{"_timeStart":"N/A","_timeElapsed":"N/A","_jobsTotal":65535,"_jobsRunning":0,"_jobsDone":0,"_progress":0,"_concurrency":800,"_status":"Starting","_message":"Starting"}
{"_timeStart":1370249987522,"_timeElapsed":1071,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":9864,"_progress":15,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:9123"}
{"ip":"127.0.0.1","port":111,"status":"close (timeout)"}
{"ip":"127.0.0.1","port":81,"status":"close (timeout)"}
{"ip":"127.0.0.1","port":53,"status":"close (timeout)"}
{"ip":"127.0.0.1","port":23,"status":"open","banner":"Debian GNU/Linux jessie/sid\\r\\ndebian login:"}
{"ip":"127.0.0.1","port":5432,"status":"close (timeout)"}
{"_timeStart":1370249987522,"_timeElapsed":2092,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":19851,"_progress":30,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:19101"}
{"_timeStart":1370249987522,"_timeElapsed":3125,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":30535,"_progress":46,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:29804"}
{"ip":"127.0.0.1","port":27017,"status":"close (timeout)"}
{"ip":"127.0.0.1","port":28017,"status":"close (timeout)"}
{"_timeStart":1370249987522,"_timeElapsed":4130,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":40467,"_progress":61,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:39713"}
{"ip":"127.0.0.1","port":34170,"status":"close (timeout)"}
{"_timeStart":1370249987522,"_timeElapsed":5180,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":51215,"_progress":78,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:50421"}
{"_timeStart":1370249987522,"_timeElapsed":6256,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":61103,"_progress":93,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:60322"}
{"ip":"127.0.0.1","port":52988,"status":"close (timeout)"}
{"ip":"127.0.0.1","port":59725,"status":"close (timeout)"}
{"_timeStart":1370249987522,"_timeElapsed":7089,"_jobsTotal":65535,"_jobsRunning":0,"_jobsDone":65535,"_progress":100,"_concurrency":800,"_status":"Finished","_message":"Scanned 127.0.0.1:59725"}
```
