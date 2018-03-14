from multiprocessing import Process
import sys
import win32serviceutil
import win32service
import servicemanager

from uocciny import app


class Service(win32serviceutil.ServiceFramework):
    _svc_name_ = "UoccinyService"
    _svc_display_name_ = "Uocciny Service"
    _svc_description_ = "Uocciny API"

    def __init__(self, *args):
        win32serviceutil.ServiceFramework.__init__(self, *args)
        self.process = None

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        self.process.terminate()
        self.ReportServiceStatus(win32service.SERVICE_STOPPED)

    def SvcDoRun(self):
        self.process = Process(target=self.main)
        self.process.start()
        self.process.run()

    def main(self):
        app.run(port=5000)


if __name__ == '__main__':
    if len(sys.argv) == 1:
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(Service)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        win32serviceutil.HandleCommandLine(Service)
