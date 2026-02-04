2026-02-04T08:00:47.000000000Z [inf]  Starting Container
2026-02-04T08:00:48.617806970Z [err]  [2026-02-04 08:00:47 +0000] [1] [INFO] Using worker: sync
2026-02-04T08:00:48.617814607Z [err]  [2026-02-04 08:00:47 +0000] [4] [INFO] Booting worker with pid: 4
2026-02-04T08:00:48.617818463Z [err]  [2026-02-04 08:00:47 +0000] [5] [INFO] Booting worker with pid: 5
2026-02-04T08:00:48.617821992Z [err]  [2026-02-04 08:00:48 +0000] [4] [ERROR] Exception in worker process
2026-02-04T08:00:48.617825525Z [err]  Traceback (most recent call last):
2026-02-04T08:00:48.617831572Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:48.617835121Z [err]      worker.init_process()
2026-02-04T08:00:48.617838584Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:48.617842088Z [err]      self.load_wsgi()
2026-02-04T08:00:48.617846162Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:48.617849642Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:48.617853179Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:48.617856379Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:48.617860477Z [err]      self.callable = self.load()
2026-02-04T08:00:48.617864597Z [err]  [2026-02-04 08:00:47 +0000] [1] [INFO] Starting gunicorn 21.2.0
2026-02-04T08:00:48.617866598Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:48.617871499Z [err]  [2026-02-04 08:00:47 +0000] [1] [INFO] Listening at: http://0.0.0.0:5000 (1)
2026-02-04T08:00:48.617871817Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:48.618771555Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:48.618778349Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:48.618783342Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:48.618787229Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:48.618790659Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:48.618794367Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:48.618797688Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:48.618801204Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:48.618805554Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:48.618810336Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:48.618810963Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:48.618814781Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:48.618817335Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:48.618820258Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:48.618823209Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:48.618826485Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:48.618828613Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:48.618831619Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:48.618835122Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:48.619455551Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:48.619460236Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:48.619496043Z [err]      ^^^^^^
2026-02-04T08:00:48.619499317Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:48.619504288Z [err]  [2026-02-04 08:00:48 +0000] [4] [INFO] Worker exiting (pid: 4)
2026-02-04T08:00:48.619507881Z [err]  [2026-02-04 08:00:48 +0000] [5] [ERROR] Exception in worker process
2026-02-04T08:00:48.619511567Z [err]  Traceback (most recent call last):
2026-02-04T08:00:48.619515010Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:48.619518220Z [err]      worker.init_process()
2026-02-04T08:00:48.619521250Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:48.619524262Z [err]      self.load_wsgi()
2026-02-04T08:00:48.619527808Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:48.619531348Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:48.619534738Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:48.619538136Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:48.619541363Z [err]      self.callable = self.load()
2026-02-04T08:00:48.619544435Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:48.619547667Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:48.619551148Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:48.620256770Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:48.620262318Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:48.620266808Z [err]      ^^^^^^
2026-02-04T08:00:48.620271392Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:48.620274659Z [err]  [2026-02-04 08:00:48 +0000] [5] [INFO] Worker exiting (pid: 5)
2026-02-04T08:00:48.620312995Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:48.620315733Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:48.620318444Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:48.620321121Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:48.620323905Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:48.620326408Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:48.620328936Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:48.620332544Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:48.620335292Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:48.620338141Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:48.620341010Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:48.620344510Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:48.620347525Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:48.620350541Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:48.620861212Z [err]  [2026-02-04 08:00:48 +0000] [1] [ERROR] Worker (pid:4) exited with code 3
2026-02-04T08:00:48.620865325Z [err]  [2026-02-04 08:00:48 +0000] [1] [ERROR] Worker (pid:5) was sent SIGTERM!
2026-02-04T08:00:48.620868403Z [err]  [2026-02-04 08:00:48 +0000] [1] [ERROR] Shutting down: Master
2026-02-04T08:00:48.620871548Z [err]  [2026-02-04 08:00:48 +0000] [1] [ERROR] Reason: Worker failed to boot.
2026-02-04T08:00:49.120893167Z [err]  [2026-02-04 08:00:49 +0000] [1] [INFO] Starting gunicorn 21.2.0
2026-02-04T08:00:49.120895812Z [err]  [2026-02-04 08:00:49 +0000] [1] [INFO] Listening at: http://0.0.0.0:5000 (1)
2026-02-04T08:00:49.120898420Z [err]  [2026-02-04 08:00:49 +0000] [1] [INFO] Using worker: sync
2026-02-04T08:00:49.120900893Z [err]  [2026-02-04 08:00:49 +0000] [4] [INFO] Booting worker with pid: 4
2026-02-04T08:00:49.161178525Z [err]  [2026-02-04 08:00:49 +0000] [5] [INFO] Booting worker with pid: 5
2026-02-04T08:00:49.631301979Z [err]  [2026-02-04 08:00:49 +0000] [4] [ERROR] Exception in worker process
2026-02-04T08:00:49.631309341Z [err]  Traceback (most recent call last):
2026-02-04T08:00:49.631313348Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:49.631316734Z [err]      worker.init_process()
2026-02-04T08:00:49.631320719Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:49.631325312Z [err]      self.load_wsgi()
2026-02-04T08:00:49.631328909Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:49.631332491Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:49.631336010Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:49.631339734Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:49.631342784Z [err]      self.callable = self.load()
2026-02-04T08:00:49.631346052Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:49.631349117Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:49.631352220Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:49.631355168Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:49.631357912Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:49.631361186Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:49.631366014Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:49.631764680Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:49.631767612Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:49.631771051Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:49.631774025Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:49.631776927Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:49.631779695Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:49.631782282Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:49.631785038Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:49.631787835Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:49.631790502Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:49.631793227Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:49.631796558Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:49.631800024Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:49.631804018Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:49.631807443Z [err]      ^^^^^^
2026-02-04T08:00:49.631810723Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:49.631813816Z [err]  [2026-02-04 08:00:49 +0000] [4] [INFO] Worker exiting (pid: 4)
2026-02-04T08:00:49.631817469Z [err]  [2026-02-04 08:00:49 +0000] [5] [ERROR] Exception in worker process
2026-02-04T08:00:49.631821007Z [err]  Traceback (most recent call last):
2026-02-04T08:00:49.632759088Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:49.632762994Z [err]      worker.init_process()
2026-02-04T08:00:49.632766485Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:49.632770258Z [err]      self.load_wsgi()
2026-02-04T08:00:49.632775022Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:49.632778961Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:49.632782181Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:49.632785269Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:49.632788779Z [err]      self.callable = self.load()
2026-02-04T08:00:49.632792306Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:49.632795823Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:49.632799377Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:49.632802806Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:49.632808897Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:49.632812255Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:49.632815389Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:49.632818853Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:49.633728652Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:49.633733961Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:49.633735237Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:49.633741084Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:49.633741886Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:49.633747771Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:49.633748721Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:49.633754907Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:49.633755967Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:49.633759961Z [err]      ^^^^^^
2026-02-04T08:00:49.633763915Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:49.633766384Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:49.633772456Z [err]  [2026-02-04 08:00:49 +0000] [5] [INFO] Worker exiting (pid: 5)
2026-02-04T08:00:49.633772516Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:49.633776465Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:49.633779811Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:49.635505129Z [err]  [2026-02-04 08:00:49 +0000] [1] [ERROR] Worker (pid:4) exited with code 3
2026-02-04T08:00:49.641139730Z [err]  [2026-02-04 08:00:49 +0000] [1] [ERROR] Worker (pid:5) was sent SIGTERM!
2026-02-04T08:00:49.740633910Z [err]  [2026-02-04 08:00:49 +0000] [1] [ERROR] Shutting down: Master
2026-02-04T08:00:49.740636857Z [err]  [2026-02-04 08:00:49 +0000] [1] [ERROR] Reason: Worker failed to boot.
2026-02-04T08:00:50.269760729Z [err]  [2026-02-04 08:00:50 +0000] [1] [INFO] Starting gunicorn 21.2.0
2026-02-04T08:00:50.269765216Z [err]  [2026-02-04 08:00:50 +0000] [1] [INFO] Listening at: http://0.0.0.0:5000 (1)
2026-02-04T08:00:50.269768283Z [err]  [2026-02-04 08:00:50 +0000] [1] [INFO] Using worker: sync
2026-02-04T08:00:50.269771502Z [err]  [2026-02-04 08:00:50 +0000] [4] [INFO] Booting worker with pid: 4
2026-02-04T08:00:50.304604732Z [err]  [2026-02-04 08:00:50 +0000] [5] [INFO] Booting worker with pid: 5
2026-02-04T08:00:50.728719007Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:50.728726200Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:50.728730852Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:50.728732071Z [err]  [2026-02-04 08:00:50 +0000] [4] [ERROR] Exception in worker process
2026-02-04T08:00:50.728737652Z [err]  Traceback (most recent call last):
2026-02-04T08:00:50.728742204Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:50.728745283Z [err]      worker.init_process()
2026-02-04T08:00:50.728748146Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:50.728751126Z [err]      self.load_wsgi()
2026-02-04T08:00:50.728753841Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:50.728756586Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:50.728759344Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:50.728762059Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:50.728764959Z [err]      self.callable = self.load()
2026-02-04T08:00:50.728767763Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:50.728770643Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:50.728773336Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:50.728776190Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:50.729562872Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:50.729567805Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:50.729571975Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:50.729577305Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:50.729580669Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:50.729584653Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:50.729588230Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:50.729591624Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:50.729595401Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:50.729599024Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:50.729602410Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:50.729606174Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:50.729611011Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:50.729617367Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:50.729620696Z [err]      ^^^^^^
2026-02-04T08:00:50.729624597Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:50.729627421Z [err]  [2026-02-04 08:00:50 +0000] [4] [INFO] Worker exiting (pid: 4)
2026-02-04T08:00:50.751943125Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:50.751949129Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:50.751954169Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:50.751957926Z [err]  [2026-02-04 08:00:50 +0000] [5] [ERROR] Exception in worker process
2026-02-04T08:00:50.751964417Z [err]  Traceback (most recent call last):
2026-02-04T08:00:50.751968066Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:50.751971541Z [err]      worker.init_process()
2026-02-04T08:00:50.751974576Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:50.751977925Z [err]      self.load_wsgi()
2026-02-04T08:00:50.751983163Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:50.751986920Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:50.751990367Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:50.751994705Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:50.751998001Z [err]      self.callable = self.load()
2026-02-04T08:00:50.752001024Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:50.752004188Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:50.752007218Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:50.752010609Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:50.752723513Z [err]  [2026-02-04 08:00:50 +0000] [5] [INFO] Worker exiting (pid: 5)
2026-02-04T08:00:50.752736554Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:50.752741571Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:50.752745597Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:50.752748671Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:50.752751721Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:50.752754809Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:50.752757989Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:50.752760858Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:50.752763621Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:50.752766416Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:50.752769428Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:50.752772585Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:50.752775726Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:50.752778623Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:50.752782768Z [err]      ^^^^^^
2026-02-04T08:00:50.752785708Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:50.843185288Z [err]  [2026-02-04 08:00:50 +0000] [1] [ERROR] Worker (pid:4) exited with code 3
2026-02-04T08:00:50.848613044Z [err]  [2026-02-04 08:00:50 +0000] [1] [ERROR] Worker (pid:5) was sent SIGTERM!
2026-02-04T08:00:50.941223275Z [err]  [2026-02-04 08:00:50 +0000] [1] [ERROR] Shutting down: Master
2026-02-04T08:00:50.941231606Z [err]  [2026-02-04 08:00:50 +0000] [1] [ERROR] Reason: Worker failed to boot.
2026-02-04T08:00:51.631017267Z [err]  [2026-02-04 08:00:51 +0000] [1] [INFO] Starting gunicorn 21.2.0
2026-02-04T08:00:51.631021347Z [err]  [2026-02-04 08:00:51 +0000] [1] [INFO] Listening at: http://0.0.0.0:5000 (1)
2026-02-04T08:00:51.631024686Z [err]  [2026-02-04 08:00:51 +0000] [1] [INFO] Using worker: sync
2026-02-04T08:00:51.631028111Z [err]  [2026-02-04 08:00:51 +0000] [4] [INFO] Booting worker with pid: 4
2026-02-04T08:00:51.631031228Z [err]  [2026-02-04 08:00:51 +0000] [5] [INFO] Booting worker with pid: 5
2026-02-04T08:00:51.957886182Z [err]  [2026-02-04 08:00:51 +0000] [4] [ERROR] Exception in worker process
2026-02-04T08:00:51.957892525Z [err]  Traceback (most recent call last):
2026-02-04T08:00:51.957896690Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:51.957902267Z [err]      worker.init_process()
2026-02-04T08:00:51.957905581Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:51.957909707Z [err]      self.load_wsgi()
2026-02-04T08:00:51.957913393Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:51.957916729Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:51.957919760Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:51.957923482Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:51.957929263Z [err]      self.callable = self.load()
2026-02-04T08:00:51.957932828Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:51.957936425Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:51.957939827Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:51.957943325Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:51.957946309Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:51.957949694Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:51.957954236Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:51.958740889Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:51.958744512Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:51.958747750Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:51.958751267Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:51.958754972Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:51.958758202Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:51.958761848Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:51.958765447Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:51.958769685Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:51.958773332Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:51.958776142Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:51.958779042Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:51.958781468Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:51.958785963Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:51.958789145Z [err]      ^^^^^^
2026-02-04T08:00:51.958791725Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:51.958794606Z [err]  [2026-02-04 08:00:51 +0000] [4] [INFO] Worker exiting (pid: 4)
2026-02-04T08:00:51.980687562Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:51.980693635Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:51.980698075Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:51.980701338Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:51.980704463Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:51.980707876Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:51.980710420Z [err]  [2026-02-04 08:00:51 +0000] [5] [ERROR] Exception in worker process
2026-02-04T08:00:51.980713451Z [err]  Traceback (most recent call last):
2026-02-04T08:00:51.980716279Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:51.980720769Z [err]      worker.init_process()
2026-02-04T08:00:51.980723837Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:51.980726510Z [err]      self.load_wsgi()
2026-02-04T08:00:51.980729230Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:51.980731905Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:51.980734532Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:51.980737617Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:51.980740334Z [err]      self.callable = self.load()
2026-02-04T08:00:51.980743470Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:51.981521211Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:51.981522170Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:51.981528898Z [err]  [2026-02-04 08:00:51 +0000] [5] [INFO] Worker exiting (pid: 5)
2026-02-04T08:00:51.981528961Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:51.981530140Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:51.981534636Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:51.981539607Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:51.981540757Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:51.981546611Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:51.981547186Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:51.981552437Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:51.981553693Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:51.981557357Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:51.981560991Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:51.981562813Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:51.981567185Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:51.981568212Z [err]      ^^^^^^
2026-02-04T08:00:52.072795222Z [err]  [2026-02-04 08:00:52 +0000] [1] [ERROR] Worker (pid:4) exited with code 3
2026-02-04T08:00:52.078063613Z [err]  [2026-02-04 08:00:52 +0000] [1] [ERROR] Worker (pid:5) was sent SIGTERM!
2026-02-04T08:00:52.173976564Z [err]  [2026-02-04 08:00:52 +0000] [1] [ERROR] Shutting down: Master
2026-02-04T08:00:52.173982361Z [err]  [2026-02-04 08:00:52 +0000] [1] [ERROR] Reason: Worker failed to boot.
2026-02-04T08:00:52.653082725Z [err]  [2026-02-04 08:00:52 +0000] [1] [INFO] Starting gunicorn 21.2.0
2026-02-04T08:00:52.653088525Z [err]  [2026-02-04 08:00:52 +0000] [1] [INFO] Listening at: http://0.0.0.0:5000 (1)
2026-02-04T08:00:52.653092712Z [err]  [2026-02-04 08:00:52 +0000] [1] [INFO] Using worker: sync
2026-02-04T08:00:52.654199411Z [err]  [2026-02-04 08:00:52 +0000] [4] [INFO] Booting worker with pid: 4
2026-02-04T08:00:52.695031829Z [err]  [2026-02-04 08:00:52 +0000] [5] [INFO] Booting worker with pid: 5
2026-02-04T08:00:53.117862068Z [err]  [2026-02-04 08:00:53 +0000] [4] [ERROR] Exception in worker process
2026-02-04T08:00:53.117871901Z [err]  Traceback (most recent call last):
2026-02-04T08:00:53.117876026Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:53.117878736Z [err]      worker.init_process()
2026-02-04T08:00:53.117882814Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:53.117885878Z [err]      self.load_wsgi()
2026-02-04T08:00:53.117888765Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:53.117891318Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:53.117894132Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:53.117898148Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:53.117901448Z [err]      self.callable = self.load()
2026-02-04T08:00:53.117904908Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:53.117908254Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:53.117911680Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:53.117914540Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:53.117917047Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:53.117919837Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:53.117922770Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:53.118515983Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:53.118523956Z [err]  [2026-02-04 08:00:53 +0000] [4] [INFO] Worker exiting (pid: 4)
2026-02-04T08:00:53.118524911Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:53.118530854Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:53.118534838Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:53.118539183Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:53.118544273Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:53.118547985Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:53.118551480Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:53.118563754Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:53.118566659Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:53.118569670Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:53.118572572Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:53.118575665Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:53.118579492Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:53.118582549Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:53.118585538Z [err]      ^^^^^^
2026-02-04T08:00:53.159196201Z [err]  [2026-02-04 08:00:53 +0000] [5] [ERROR] Exception in worker process
2026-02-04T08:00:53.159198701Z [err]  Traceback (most recent call last):
2026-02-04T08:00:53.159201298Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:53.159204228Z [err]      worker.init_process()
2026-02-04T08:00:53.159206843Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:53.159209607Z [err]      self.load_wsgi()
2026-02-04T08:00:53.159212186Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:53.159214795Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:53.159217580Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:53.159220154Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:53.159222726Z [err]      self.callable = self.load()
2026-02-04T08:00:53.159225398Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:53.159228169Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:53.159230860Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:53.159233563Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:53.159236363Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:53.159239287Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:53.159242363Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:53.160131382Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:53.160138095Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:53.160142011Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:53.160146435Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:53.160149960Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:53.160154329Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:53.160157517Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:53.160162915Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:53.160166408Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:53.160169824Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:53.160174018Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:53.160177549Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:53.160180991Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:53.160184642Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:53.160188420Z [err]      ^^^^^^
2026-02-04T08:00:53.160192061Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:53.160195767Z [err]  [2026-02-04 08:00:53 +0000] [5] [INFO] Worker exiting (pid: 5)
2026-02-04T08:00:53.257724650Z [err]  [2026-02-04 08:00:53 +0000] [1] [ERROR] Worker (pid:4) exited with code 3
2026-02-04T08:00:53.257728400Z [err]  [2026-02-04 08:00:53 +0000] [1] [ERROR] Worker (pid:5) was sent SIGTERM!
2026-02-04T08:00:53.334825043Z [err]  [2026-02-04 08:00:53 +0000] [1] [ERROR] Shutting down: Master
2026-02-04T08:00:53.334828274Z [err]  [2026-02-04 08:00:53 +0000] [1] [ERROR] Reason: Worker failed to boot.
2026-02-04T08:00:53.899060743Z [err]  [2026-02-04 08:00:53 +0000] [1] [INFO] Starting gunicorn 21.2.0
2026-02-04T08:00:53.899074463Z [err]  [2026-02-04 08:00:53 +0000] [1] [INFO] Listening at: http://0.0.0.0:5000 (1)
2026-02-04T08:00:53.899077992Z [err]  [2026-02-04 08:00:53 +0000] [1] [INFO] Using worker: sync
2026-02-04T08:00:53.899081453Z [err]  [2026-02-04 08:00:53 +0000] [4] [INFO] Booting worker with pid: 4
2026-02-04T08:00:53.983765799Z [err]  [2026-02-04 08:00:53 +0000] [5] [INFO] Booting worker with pid: 5
2026-02-04T08:00:54.363607199Z [err]  [2026-02-04 08:00:54 +0000] [4] [ERROR] Exception in worker process
2026-02-04T08:00:54.363611602Z [err]  Traceback (most recent call last):
2026-02-04T08:00:54.363615120Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:54.363618157Z [err]      worker.init_process()
2026-02-04T08:00:54.363621529Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:54.363625609Z [err]      self.load_wsgi()
2026-02-04T08:00:54.363628634Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:54.363631596Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:54.363634315Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:54.363650304Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:54.363654109Z [err]      self.callable = self.load()
2026-02-04T08:00:54.363656934Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:54.363659874Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:54.363662627Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:54.363665237Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:54.363667820Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:54.363670491Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:54.363673114Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:54.364153284Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:54.364159104Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:54.364162630Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:54.364165963Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:54.364171724Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:54.364175400Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:54.364178609Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:54.364181800Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:54.364184957Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:54.364188819Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:54.364192408Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:54.364195548Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:54.364199387Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:54.364202809Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:54.364205747Z [err]      ^^^^^^
2026-02-04T08:00:54.364208704Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:54.364211919Z [err]  [2026-02-04 08:00:54 +0000] [4] [INFO] Worker exiting (pid: 4)
2026-02-04T08:00:54.434752507Z [err]  [2026-02-04 08:00:54 +0000] [5] [ERROR] Exception in worker process
2026-02-04T08:00:54.434759537Z [err]  Traceback (most recent call last):
2026-02-04T08:00:54.434763409Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:54.434766401Z [err]      worker.init_process()
2026-02-04T08:00:54.434769430Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:54.434776810Z [err]      self.load_wsgi()
2026-02-04T08:00:54.434781207Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:54.434784595Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:54.434787898Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:54.434791364Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:54.434794638Z [err]      self.callable = self.load()
2026-02-04T08:00:54.434798337Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:54.434802344Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:54.434805333Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:54.434808209Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:54.434811292Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:54.434814627Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:54.434818138Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:54.435526464Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:54.435531313Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:54.435534787Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:54.435538503Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:54.435541770Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:54.435544715Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:54.435547765Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:54.435551058Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:54.435554848Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:54.435558539Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:54.435562671Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:54.435566789Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:54.435570066Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:54.435573090Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:54.435576057Z [err]      ^^^^^^
2026-02-04T08:00:54.435579372Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:54.435582076Z [err]  [2026-02-04 08:00:54 +0000] [5] [INFO] Worker exiting (pid: 5)
2026-02-04T08:00:54.474506886Z [err]  [2026-02-04 08:00:54 +0000] [1] [ERROR] Worker (pid:5) was sent SIGTERM!
2026-02-04T08:00:54.474582711Z [err]  [2026-02-04 08:00:54 +0000] [1] [ERROR] Worker (pid:4) exited with code 3
2026-02-04T08:00:54.643029286Z [err]  [2026-02-04 08:00:54 +0000] [1] [ERROR] Shutting down: Master
2026-02-04T08:00:54.643032315Z [err]  [2026-02-04 08:00:54 +0000] [1] [ERROR] Reason: Worker failed to boot.
2026-02-04T08:00:55.180506401Z [err]  [2026-02-04 08:00:55 +0000] [1] [INFO] Starting gunicorn 21.2.0
2026-02-04T08:00:55.180512427Z [err]  [2026-02-04 08:00:55 +0000] [1] [INFO] Listening at: http://0.0.0.0:5000 (1)
2026-02-04T08:00:55.180516664Z [err]  [2026-02-04 08:00:55 +0000] [1] [INFO] Using worker: sync
2026-02-04T08:00:55.180520109Z [err]  [2026-02-04 08:00:55 +0000] [4] [INFO] Booting worker with pid: 4
2026-02-04T08:00:55.203097635Z [err]  [2026-02-04 08:00:55 +0000] [5] [INFO] Booting worker with pid: 5
2026-02-04T08:00:55.635895670Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:55.635902870Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:55.635906655Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:55.635937744Z [err]  [2026-02-04 08:00:55 +0000] [4] [ERROR] Exception in worker process
2026-02-04T08:00:55.635941262Z [err]  Traceback (most recent call last):
2026-02-04T08:00:55.635945548Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:55.635949677Z [err]      worker.init_process()
2026-02-04T08:00:55.635953299Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:55.635956476Z [err]      self.load_wsgi()
2026-02-04T08:00:55.635959985Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:55.635963613Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:55.635968093Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:55.635971451Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:55.635974723Z [err]      self.callable = self.load()
2026-02-04T08:00:55.635978777Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:55.635981800Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:55.635984745Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:55.635987905Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:55.639844042Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:55.639848397Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:55.639851352Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:55.639854325Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:55.639857448Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:55.639861137Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:55.639864290Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:55.639868114Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:55.639871319Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:55.639874297Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:55.639877079Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:55.639879809Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:55.639882573Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:55.639885518Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:55.639888352Z [err]      ^^^^^^
2026-02-04T08:00:55.639891112Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:55.639894400Z [err]  [2026-02-04 08:00:55 +0000] [4] [INFO] Worker exiting (pid: 4)
2026-02-04T08:00:55.658878529Z [err]  [2026-02-04 08:00:55 +0000] [5] [ERROR] Exception in worker process
2026-02-04T08:00:55.658885011Z [err]  Traceback (most recent call last):
2026-02-04T08:00:55.658889054Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:55.658892630Z [err]      worker.init_process()
2026-02-04T08:00:55.658896884Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:55.658900709Z [err]      self.load_wsgi()
2026-02-04T08:00:55.658905558Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:55.658909471Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:55.658913060Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:55.658916666Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:55.658919910Z [err]      self.callable = self.load()
2026-02-04T08:00:55.658924352Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:55.658927465Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:55.658930831Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:55.658933928Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:55.658937815Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:55.658941476Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:55.658945337Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:55.659547458Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:55.659552029Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:55.659555493Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:55.659558526Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:55.659561413Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:55.659564271Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:55.659567764Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:55.659570487Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:55.659573596Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:55.659577387Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:55.659580125Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:55.659582857Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:55.659585489Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:55.659588143Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:55.659591039Z [err]      ^^^^^^
2026-02-04T08:00:55.659595078Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:55.659599781Z [err]  [2026-02-04 08:00:55 +0000] [5] [INFO] Worker exiting (pid: 5)
2026-02-04T08:00:55.724021895Z [err]  [2026-02-04 08:00:55 +0000] [1] [ERROR] Worker (pid:4) exited with code 3
2026-02-04T08:00:55.728583543Z [err]  [2026-02-04 08:00:55 +0000] [1] [ERROR] Worker (pid:5) was sent SIGTERM!
2026-02-04T08:00:55.826332384Z [err]  [2026-02-04 08:00:55 +0000] [1] [ERROR] Shutting down: Master
2026-02-04T08:00:55.826337296Z [err]  [2026-02-04 08:00:55 +0000] [1] [ERROR] Reason: Worker failed to boot.
2026-02-04T08:00:56.383785654Z [err]  [2026-02-04 08:00:56 +0000] [1] [INFO] Starting gunicorn 21.2.0
2026-02-04T08:00:56.383794945Z [err]  [2026-02-04 08:00:56 +0000] [1] [INFO] Listening at: http://0.0.0.0:5000 (1)
2026-02-04T08:00:56.383800190Z [err]  [2026-02-04 08:00:56 +0000] [1] [INFO] Using worker: sync
2026-02-04T08:00:56.383804982Z [err]  [2026-02-04 08:00:56 +0000] [4] [INFO] Booting worker with pid: 4
2026-02-04T08:00:56.444461192Z [err]  [2026-02-04 08:00:56 +0000] [5] [INFO] Booting worker with pid: 5
2026-02-04T08:00:56.843658095Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:56.843665203Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:56.843669598Z [err]      self.callable = self.load()
2026-02-04T08:00:56.843674863Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:56.843678292Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:56.843682700Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:56.843689159Z [err]  [2026-02-04 08:00:56 +0000] [4] [ERROR] Exception in worker process
2026-02-04T08:00:56.843689924Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:56.843696398Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:56.843697006Z [err]  Traceback (most recent call last):
2026-02-04T08:00:56.843701764Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:56.843704207Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:56.843706827Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:56.843710319Z [err]      worker.init_process()
2026-02-04T08:00:56.843714527Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:56.843718590Z [err]      self.load_wsgi()
2026-02-04T08:00:56.843723617Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:56.843727537Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:56.844633420Z [err]  [2026-02-04 08:00:56 +0000] [4] [INFO] Worker exiting (pid: 4)
2026-02-04T08:00:56.844636291Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:56.844643256Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:56.844647077Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:56.844651325Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:56.844655212Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:56.844659016Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:56.844663064Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:56.844666866Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:56.844672358Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:56.844676288Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:56.844679960Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:56.844684837Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:56.844688594Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:56.844693389Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:56.844696907Z [err]      ^^^^^^
2026-02-04T08:00:56.844701000Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:56.909859323Z [err]  [2026-02-04 08:00:56 +0000] [5] [ERROR] Exception in worker process
2026-02-04T08:00:56.909865288Z [err]  Traceback (most recent call last):
2026-02-04T08:00:56.909868650Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:56.909871797Z [err]      worker.init_process()
2026-02-04T08:00:56.909874952Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:56.909878830Z [err]      self.load_wsgi()
2026-02-04T08:00:56.909882461Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:56.909887092Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:56.909890137Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:56.909893438Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:56.909897433Z [err]      self.callable = self.load()
2026-02-04T08:00:56.909900401Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:56.909903578Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:56.909906472Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:56.909909497Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:56.909912758Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:56.909915715Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:56.909919053Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:56.911111754Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:56.911121377Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:56.911125066Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:56.911128837Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:56.911132854Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:56.911136823Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:56.911140774Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:56.911144649Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:56.911149202Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:56.911154409Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:56.911157899Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:56.911161339Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:56.911164912Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:56.911168170Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:56.911171831Z [err]      ^^^^^^
2026-02-04T08:00:56.911175067Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:56.911179373Z [err]  [2026-02-04 08:00:56 +0000] [5] [INFO] Worker exiting (pid: 5)
2026-02-04T08:00:56.961742857Z [err]  [2026-02-04 08:00:56 +0000] [1] [ERROR] Worker (pid:4) exited with code 3
2026-02-04T08:00:56.961751226Z [err]  [2026-02-04 08:00:56 +0000] [1] [ERROR] Worker (pid:5) was sent SIGTERM!
2026-02-04T08:00:57.055702666Z [err]  [2026-02-04 08:00:57 +0000] [1] [ERROR] Shutting down: Master
2026-02-04T08:00:57.055707341Z [err]  [2026-02-04 08:00:57 +0000] [1] [ERROR] Reason: Worker failed to boot.
2026-02-04T08:00:57.662940466Z [err]  [2026-02-04 08:00:57 +0000] [1] [INFO] Starting gunicorn 21.2.0
2026-02-04T08:00:57.662943446Z [err]  [2026-02-04 08:00:57 +0000] [1] [INFO] Listening at: http://0.0.0.0:5000 (1)
2026-02-04T08:00:57.662947322Z [err]  [2026-02-04 08:00:57 +0000] [1] [INFO] Using worker: sync
2026-02-04T08:00:57.662950273Z [err]  [2026-02-04 08:00:57 +0000] [4] [INFO] Booting worker with pid: 4
2026-02-04T08:00:57.662953835Z [err]  [2026-02-04 08:00:57 +0000] [5] [INFO] Booting worker with pid: 5
2026-02-04T08:00:58.053312581Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:58.053324541Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:58.053330108Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:58.053334907Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:58.053339642Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:58.053346985Z [err]  [2026-02-04 08:00:58 +0000] [4] [ERROR] Exception in worker process
2026-02-04T08:00:58.053351754Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:58.053351802Z [err]  Traceback (most recent call last):
2026-02-04T08:00:58.053355619Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:58.053358799Z [err]      worker.init_process()
2026-02-04T08:00:58.053361668Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:58.053364515Z [err]      self.load_wsgi()
2026-02-04T08:00:58.053367579Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:58.053370614Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:58.053373691Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:58.053376469Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:58.053379996Z [err]      self.callable = self.load()
2026-02-04T08:00:58.053382762Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:58.054139710Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:58.054145292Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:58.054148687Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:58.054151653Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:58.054154563Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:58.054157757Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:58.054162579Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:58.054165882Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:58.054168730Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:58.054171868Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:58.054175144Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:58.054178219Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:58.054180988Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:58.054185422Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:58.054189452Z [err]      ^^^^^^
2026-02-04T08:00:58.054192622Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:58.054195436Z [err]  [2026-02-04 08:00:58 +0000] [4] [INFO] Worker exiting (pid: 4)
2026-02-04T08:00:58.099084054Z [err]  [2026-02-04 08:00:58 +0000] [5] [ERROR] Exception in worker process
2026-02-04T08:00:58.099090076Z [err]  Traceback (most recent call last):
2026-02-04T08:00:58.099096176Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:58.099099890Z [err]      worker.init_process()
2026-02-04T08:00:58.099102965Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:58.099106656Z [err]      self.load_wsgi()
2026-02-04T08:00:58.099109917Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:58.099113404Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:58.099116582Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:58.099120314Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:58.099123023Z [err]      self.callable = self.load()
2026-02-04T08:00:58.099125826Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:58.099129084Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:58.099132364Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:58.099135540Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:58.099138410Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:58.099142519Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:58.099145447Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:58.100381495Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:58.100387868Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:58.100392580Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:58.100395975Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:58.100399107Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:58.100402070Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:58.100405394Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:58.100410758Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:58.100414473Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:58.100417544Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:58.100420375Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:58.100423126Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:58.100426838Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:58.100430681Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:58.100434389Z [err]      ^^^^^^
2026-02-04T08:00:58.100438059Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:58.100440911Z [err]  [2026-02-04 08:00:58 +0000] [5] [INFO] Worker exiting (pid: 5)
2026-02-04T08:00:58.170290191Z [err]  [2026-02-04 08:00:58 +0000] [1] [ERROR] Worker (pid:4) exited with code 3
2026-02-04T08:00:58.170294570Z [err]  [2026-02-04 08:00:58 +0000] [1] [ERROR] Worker (pid:5) was sent SIGTERM!
2026-02-04T08:00:58.255847392Z [err]  [2026-02-04 08:00:58 +0000] [1] [ERROR] Shutting down: Master
2026-02-04T08:00:58.255851484Z [err]  [2026-02-04 08:00:58 +0000] [1] [ERROR] Reason: Worker failed to boot.
2026-02-04T08:00:58.796169261Z [err]  [2026-02-04 08:00:58 +0000] [1] [INFO] Starting gunicorn 21.2.0
2026-02-04T08:00:58.796173581Z [err]  [2026-02-04 08:00:58 +0000] [1] [INFO] Listening at: http://0.0.0.0:5000 (1)
2026-02-04T08:00:58.796177001Z [err]  [2026-02-04 08:00:58 +0000] [1] [INFO] Using worker: sync
2026-02-04T08:00:58.796181622Z [err]  [2026-02-04 08:00:58 +0000] [4] [INFO] Booting worker with pid: 4
2026-02-04T08:00:58.881723716Z [err]  [2026-02-04 08:00:58 +0000] [5] [INFO] Booting worker with pid: 5
2026-02-04T08:00:59.274526846Z [err]  [2026-02-04 08:00:59 +0000] [4] [ERROR] Exception in worker process
2026-02-04T08:00:59.274530156Z [err]  Traceback (most recent call last):
2026-02-04T08:00:59.274533756Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:59.274537264Z [err]      worker.init_process()
2026-02-04T08:00:59.274540503Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:59.274543826Z [err]      self.load_wsgi()
2026-02-04T08:00:59.274547544Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:59.274551134Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:59.274554395Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:59.274557651Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:59.274561007Z [err]      self.callable = self.load()
2026-02-04T08:00:59.274563939Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:59.274567242Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:59.274570401Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:59.274573489Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:59.274576697Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:59.274581562Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:59.274584686Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:59.275686485Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:59.275692991Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:59.275696600Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:59.275700580Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:59.275703695Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:59.275707332Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:59.275710458Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:59.275713569Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:59.275716560Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:59.275719593Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:59.275722811Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:59.275726854Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:59.275730551Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:59.275733372Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:59.275736134Z [err]      ^^^^^^
2026-02-04T08:00:59.275739312Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:59.275742172Z [err]  [2026-02-04 08:00:59 +0000] [4] [INFO] Worker exiting (pid: 4)
2026-02-04T08:00:59.333807348Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:59.333813038Z [err]  [2026-02-04 08:00:59 +0000] [5] [ERROR] Exception in worker process
2026-02-04T08:00:59.333818932Z [err]  Traceback (most recent call last):
2026-02-04T08:00:59.333823144Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:00:59.333826952Z [err]      worker.init_process()
2026-02-04T08:00:59.333830579Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:00:59.333834222Z [err]      self.load_wsgi()
2026-02-04T08:00:59.333837222Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:00:59.333840261Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:00:59.333843718Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:00:59.333846594Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:00:59.333849414Z [err]      self.callable = self.load()
2026-02-04T08:00:59.333852277Z [err]                      ^^^^^^^^^^^
2026-02-04T08:00:59.333855176Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:00:59.333857970Z [err]      return self.load_wsgiapp()
2026-02-04T08:00:59.333860757Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:59.333863720Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:00:59.333866661Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:00:59.334896421Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:00:59.334901698Z [err]      mod = importlib.import_module(module)
2026-02-04T08:00:59.334905567Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:59.334909043Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:00:59.334912212Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:00:59.334915694Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:00:59.334921033Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:00:59.334925531Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:00:59.334929344Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:00:59.334933239Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:00:59.334936799Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:00:59.334940681Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:00:59.334944056Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:00:59.334947871Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:00:59.334951522Z [err]      ^^^^^^
2026-02-04T08:00:59.334955142Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:00:59.334958759Z [err]  [2026-02-04 08:00:59 +0000] [5] [INFO] Worker exiting (pid: 5)
2026-02-04T08:00:59.381140803Z [err]  [2026-02-04 08:00:59 +0000] [1] [ERROR] Worker (pid:4) exited with code 3
2026-02-04T08:00:59.381144898Z [err]  [2026-02-04 08:00:59 +0000] [1] [ERROR] Worker (pid:5) was sent SIGTERM!
2026-02-04T08:00:59.477522399Z [err]  [2026-02-04 08:00:59 +0000] [1] [ERROR] Shutting down: Master
2026-02-04T08:00:59.477526370Z [err]  [2026-02-04 08:00:59 +0000] [1] [ERROR] Reason: Worker failed to boot.
2026-02-04T08:00:59.989585298Z [err]  [2026-02-04 08:00:59 +0000] [1] [INFO] Starting gunicorn 21.2.0
2026-02-04T08:00:59.989590954Z [err]  [2026-02-04 08:00:59 +0000] [1] [INFO] Listening at: http://0.0.0.0:5000 (1)
2026-02-04T08:00:59.989595250Z [err]  [2026-02-04 08:00:59 +0000] [1] [INFO] Using worker: sync
2026-02-04T08:00:59.989599494Z [err]  [2026-02-04 08:00:59 +0000] [4] [INFO] Booting worker with pid: 4
2026-02-04T08:01:00.000594157Z [err]  [2026-02-04 08:00:59 +0000] [5] [INFO] Booting worker with pid: 5
2026-02-04T08:01:00.469574585Z [err]  [2026-02-04 08:01:00 +0000] [5] [ERROR] Exception in worker process
2026-02-04T08:01:00.469580830Z [err]  Traceback (most recent call last):
2026-02-04T08:01:00.469587118Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:01:00.469591793Z [err]      worker.init_process()
2026-02-04T08:01:00.469596651Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:01:00.469608511Z [err]      self.load_wsgi()
2026-02-04T08:01:00.469614731Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:01:00.469619203Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:01:00.469622858Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:01:00.469628072Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:01:00.469632306Z [err]      self.callable = self.load()
2026-02-04T08:01:00.469636172Z [err]                      ^^^^^^^^^^^
2026-02-04T08:01:00.469640436Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:01:00.469644225Z [err]      return self.load_wsgiapp()
2026-02-04T08:01:00.469648553Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:01:00.469661446Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:01:00.469665481Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:01:00.469669589Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:01:00.470683093Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:01:00.470689509Z [err]      mod = importlib.import_module(module)
2026-02-04T08:01:00.470693435Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:01:00.470697709Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:01:00.470701209Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:01:00.470704777Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:01:00.470708216Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:01:00.470712119Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:01:00.470715547Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:01:00.470719203Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:01:00.470722670Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:01:00.470725854Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:01:00.470729607Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:01:00.470732855Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:01:00.470736134Z [err]      ^^^^^^
2026-02-04T08:01:00.470739884Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:01:00.470742796Z [err]  [2026-02-04 08:01:00 +0000] [5] [INFO] Worker exiting (pid: 5)
2026-02-04T08:01:00.470746107Z [err]  [2026-02-04 08:01:00 +0000] [4] [ERROR] Exception in worker process
2026-02-04T08:01:00.470749375Z [err]  Traceback (most recent call last):
2026-02-04T08:01:00.471674049Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/arbiter.py", line 609, in spawn_worker
2026-02-04T08:01:00.471679681Z [err]      worker.init_process()
2026-02-04T08:01:00.471684039Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 134, in init_process
2026-02-04T08:01:00.471689115Z [err]      self.load_wsgi()
2026-02-04T08:01:00.471692099Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/workers/base.py", line 146, in load_wsgi
2026-02-04T08:01:00.471695157Z [err]      self.wsgi = self.app.wsgi()
2026-02-04T08:01:00.471698063Z [err]                  ^^^^^^^^^^^^^^^
2026-02-04T08:01:00.471701034Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/base.py", line 67, in wsgi
2026-02-04T08:01:00.471704614Z [err]      self.callable = self.load()
2026-02-04T08:01:00.471708049Z [err]                      ^^^^^^^^^^^
2026-02-04T08:01:00.471712929Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
2026-02-04T08:01:00.471716263Z [err]      return self.load_wsgiapp()
2026-02-04T08:01:00.471720341Z [err]             ^^^^^^^^^^^^^^^^^^^
2026-02-04T08:01:00.471723859Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
2026-02-04T08:01:00.471727095Z [err]      return util.import_app(self.app_uri)
2026-02-04T08:01:00.471730336Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:01:00.471733312Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/site-packages/gunicorn/util.py", line 371, in import_app
2026-02-04T08:01:00.472817804Z [err]      mod = importlib.import_module(module)
2026-02-04T08:01:00.472832409Z [err]            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:01:00.472837241Z [err]    File "/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8/lib/python3.12/importlib/__init__.py", line 90, in import_module
2026-02-04T08:01:00.472841026Z [err]      return _bootstrap._gcd_import(name[level:], package, level)
2026-02-04T08:01:00.472845427Z [err]             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-02-04T08:01:00.472849639Z [err]    File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
2026-02-04T08:01:00.472853076Z [err]    File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
2026-02-04T08:01:00.472856941Z [err]    File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
2026-02-04T08:01:00.472860970Z [err]    File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
2026-02-04T08:01:00.472864968Z [err]    File "<frozen importlib._bootstrap_external>", line 999, in exec_module
2026-02-04T08:01:00.472868509Z [err]    File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
2026-02-04T08:01:00.472871992Z [err]    File "/app/app.py", line 74, in <module>
2026-02-04T08:01:00.472876062Z [err]      logger.warning("Using hardcoded DATABASE_URL - environment variable not set")
2026-02-04T08:01:00.472880150Z [err]      ^^^^^^
2026-02-04T08:01:00.472883351Z [err]  NameError: name 'logger' is not defined
2026-02-04T08:01:00.472887046Z [err]  [2026-02-04 08:01:00 +0000] [4] [INFO] Worker exiting (pid: 4)
2026-02-04T08:01:00.671065362Z [err]  [2026-02-04 08:01:00 +0000] [1] [ERROR] Worker (pid:5) exited with code 3
2026-02-04T08:01:00.671068490Z [err]  [2026-02-04 08:01:00 +0000] [1] [ERROR] Worker (pid:4) was sent SIGTERM!
2026-02-04T08:01:00.676091675Z [err]  [2026-02-04 08:01:00 +0000] [1] [ERROR] Shutting down: Master
2026-02-04T08:01:00.676095901Z [err]  [2026-02-04 08:01:00 +0000] [1] [ERROR] Reason: Worker failed to boot.