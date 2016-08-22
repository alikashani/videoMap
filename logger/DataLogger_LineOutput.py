import RPi.GPIO as GPIO
import os
from gps import *
# from time import *
import time
import threading
import subprocess
import csv
import Adafruit_ADS1x15
import math

'Adafruit ADC - Shock Sensor Input'
adc = Adafruit_ADS1x15.ADS1115() # Create an ADS1115 ADC (16-bit) instance.

# Choose a gain of 1 for reading voltages from 0 to 4.09V.
# Or pick a different gain to change the range of voltages that are read:
#  - 2/3 = +/-6.144V
#  -   1 = +/-4.096V
#  -   2 = +/-2.048V
#  -   4 = +/-1.024V
#  -   8 = +/-0.512V
#  -  16 = +/-0.256V
# See table 3 in the ADS1015/ADS1115 datasheet for more info on gain.
GAIN = 1

'Bash Command Line Communication'
def bash_command(cmd): # Function to communicate via BASH
    subprocess.Popen(['/bin/bash', '-c', cmd])

'Starting up the GPS Device'
bash_command('sudo killall gpsd')
time.sleep(0.5)
bash_command('sudo gpsd /dev/ttyS0 -F /var/run/gpsd.sock') # Initialize the GPS sensor data
time.sleep(1) # Wait for the initialization to complete

'Creating a file for the data log'
fileNameTime = int(time.time()) # The filename is based on the start time of the data set
myCSVfile = open('/home/pi/RawGPS/TrackData_' + str(fileNameTime) + '.csv', 'wb')
wrCSV = csv.writer(myCSVfile, quoting=csv.QUOTE_ALL)
myGeoJSONfile = open('/home/pi/RawGPS/TrackData_' + str(fileNameTime) + '.geojson', "wb")
#wrGeoJSON = csv.writer(myGeoJSONfile, quoting=csv.QUOTE_ALL)

'Creating the GeoJSON Template'
# the template. where data from the csv will be formatted to geojson
template = \
'''            [%s, %s],
'''

# the head of the geojson file
output = \
    ''' \
{ "type": "FeatureCollection",
    "features": [
        { "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [
'''

'GPS Data Poller'
gpsd = None #seting the global variable
os.system('clear') #clear the terminal (optional)

class GpsPoller(threading.Thread):
  def __init__(self):
    threading.Thread.__init__(self)
    global gpsd #bring it in scope
    gpsd = gps(mode=WATCH_ENABLE) #starting the stream of info
    self.current_value = None
    self.running = True #setting the thread running to true

  def run(self):
    global gpsd
    while gpsp.running:
      gpsd.next() #this will continue to loop and grab EACH set of gpsd info to clear the buffer

'Initializing variables'
iter = 0
if __name__ == '__main__':
  gpsp = GpsPoller() # create the thread
  try:
    gpsp.start() # start it up
    while True: #It may take a second or two to get good data


      # Setting the 'deadband' of the data (might need to change this to use a capacitor if the noise is frequency related)
      value = adc.read_adc(1, gain=GAIN)
      valueNormalized = (12500 - value) # 'normalizing the data, from the as received offset'
      if abs(int(valueNormalized)) > 3000: # setting the threshold that the data must exceed in order to be considered valid
        shockValue = valueNormalized
      else:
        shockValue = 0

      os.system('clear')
      gpsLat = '%10f' % (float(gpsd.fix.latitude))
      gpsLong = '%.10f' % (float(gpsd.fix.longitude))
      dataTime = time.time()
      coordinates = [shockValue, dataTime, gpsLat, gpsLong]

      if float(gpsLat) != 0:
          iter += 1
          if iter >= 0:
              wrCSV.writerow(coordinates)
              output += template % (gpsLong, gpsLat)
              print coordinates

      time.sleep(1)

  except (KeyboardInterrupt, SystemExit): #when you press ctrl+c
    print "\nKilling Thread..."
    # Appending to the tail of the geoJSON file
    output = output[:-2]
    output += \
'''
            ]
            },
            "properties": {
            "prop0": "value0",
            "prop1": 0.0
            }
          }
       ]
     }
'''
    myGeoJSONfile.write(output)

    gpsp.running = False
    gpsp.join() # wait for the thread to finish what it's doing
  print "Done.\nExiting."


'Appendix'
# def shockProvoke(): # Check to see if when the shock sensor is provoked
#     if GPIO.input(shock) == False:
#         # Take snapshot on shock
#         print False
#         bash_command('sudo curl 192.168.43.102:8080/0/action/snapshot')
#         return False
#     else:
#         print True
#         return True

# Other GPS Functionality:
    #   print 'latitude    ' , gpsd.fix.latitude
    #   print 'longitude   ' , gpsd.fix.longitude
    #   print 'time utc    ' , gpsd.utc,' + ', gpsd.fix.time
    #   print 'altitude (m)' , gpsd.fix.altitude
    #   print 'eps         ' , gpsd.fix.eps
    #   print 'epx         ' , gpsd.fix.epx
    #   print 'epv         ' , gpsd.fix.epv
    #   print 'ept         ' , gpsd.fix.ept
    #   print 'speed (m/s) ' , gpsd.fix.speed
    #   print 'climb       ' , gpsd.fix.climb
    #   print 'track       ' , gpsd.fix.track
    #   print 'mode        ' , gpsd.fix.mode
    #   print 'sats        ' , gpsd.satellites
