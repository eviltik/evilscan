evilscan
===============

Massive TCP port scanner (tcp connect). Work in progress. 

[![Build Status](https://secure.travis-ci.org/eviltik/evilscan.png)](http://travis-ci.org/eviltik/evilscan)



Install
-------

>Travis said it's ok using nodejs >= 0.9. So you can install evilscan globaly using npm, as usual :
>```
>npm install -g evilscan
>```


Command line options
-------
**--target=[ip|host|cidr range]**
>Specify the target you want to scan, examples :
>```
>--target=127.0.0.1/24 
>--target=test.com
>```

**--port=[single port|port-range|mixed]**
>Specific port(s) you want to scan, examples :
>```
>--port=80
>--port=21,23
>--port=21,23,5900-5910
>--port=0-65535
>```
If not specified, no tcp scan. Usefull to fetch massive geoip infos without scanning ports

**--banner**
>Grab the banner and export it using utf-8 and encoded special chars (\r\n\t), limited to 512 bytes at the moment. 

**--raw**
>To be documented

**--isclose [=true|false, default false]**
>Shortcut for --isrefused and --istimeout

**--isrefuse [=true|false, default false]**
>Show only ports having connection refused

**--istimeout [=true|false, default false]**
>Show only ports having connection timeout

**--isopen[=true|false, default true]**
>Remove opened port from the result if value is false

**--geo**
>Add geoip information (city,country,latitude,longitude)

**--json**
>Show result as a json string

**--progress**
>Show progress status every seconds


Example usage
----------------

* Every ports on localhost, grab banner, display only opened or timeouted ports
```
root@debian:~# ./scan.js --target=127.0.0.1 --port=0-65535 --banner --isopen --istimeout
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

* Every ports on localhost, grab banner, display only opened or timeouted ports, json output, progress status each seconds
```
root@debian:~# ./scan.js --target=127.0.0.1 --port=0-65535 --banner --isopen --istimeout --progress --json
"_timeStart":"N/A","_timeElapsed":"N/A","_jobsTotal":65535,"_jobsRunning":0,"_jobsDone":0,"_progress":0,"_concurrency":800,"_status":"Starting","_message":"Starting"}
{"_timeStart":1370867204668,"_timeElapsed":1061,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":6950,"_progress":10,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:6211"}
{"ip":"127.0.0.1","port":111,"status":"close (timeout)"}
{"ip":"127.0.0.1","port":81,"status":"close (timeout)"}
{"ip":"127.0.0.1","port":53,"status":"close (timeout)"}
{"ip":"127.0.0.1","port":23,"status":"open","banner":"Debian GNU/Linux jessie/sid\\r\\ndebian login:"}
{"ip":"127.0.0.1","port":5432,"status":"close (timeout)"}
{"_timeStart":1370867204668,"_timeElapsed":2104,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":14761,"_progress":22,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:13965"}
{"_timeStart":1370867204668,"_timeElapsed":3220,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":23187,"_progress":35,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:22395"}
{"_timeStart":1370867204668,"_timeElapsed":4223,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":30874,"_progress":47,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:30110"}
{"ip":"127.0.0.1","port":27017,"status":"close (timeout)"}
{"ip":"127.0.0.1","port":28017,"status":"close (timeout)"}
{"_timeStart":1370867204668,"_timeElapsed":5223,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":38657,"_progress":58,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:37878"}
{"ip":"127.0.0.1","port":33953,"status":"close (timeout)"}
{"ip":"127.0.0.1","port":36712,"status":"close (timeout)"}
{"_timeStart":1370867204668,"_timeElapsed":6271,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":46369,"_progress":70,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:45578"}
{"ip":"127.0.0.1","port":40802,"status":"close (timeout)"}
{"_timeStart":1370867204668,"_timeElapsed":7365,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":54829,"_progress":83,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:54108"}
{"ip":"127.0.0.1","port":53013,"status":"close (timeout)"}
{"ip":"127.0.0.1","port":53656,"status":"close (timeout)"}
{"ip":"127.0.0.1","port":53632,"status":"close (timeout)"}
{"ip":"127.0.0.1","port":53400,"status":"close (timeout)"}
{"_timeStart":1370867204668,"_timeElapsed":8394,"_jobsTotal":65535,"_jobsRunning":800,"_jobsDone":62449,"_progress":95,"_concurrency":800,"_status":"Running","_message":"Scanned 127.0.0.1:61697"}
{"_timeStart":1370867204668,"_timeElapsed":8744,"_jobsTotal":65535,"_jobsRunning":0,"_jobsDone":65535,"_progress":100,"_concurrency":800,"_status":"Finished","_message":"Scanned 127.0.0.1:64739"}

