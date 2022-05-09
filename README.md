# Tasker
This is a personal project creating a test platform for various PWA technologies and API's.  The backend is anchored by Nodejs & Express while the frontend is vanilla JS.

### Voice Notes
Records and transcribes voice recordings as a sort of task list.

Uses:
- IndexedDB
- MediaRecorder
- Voice to Text API from AssemblyAI
 
### VPN Status
Shows the status of VPN connection by checking JSON file created by cron job running on host every 10 minutes.  If VPN shows down, user is notified via a text message.

Uses:
- Telynx SMS API

### Router Snapshot
Takes screen shot of who's connected to wifi router at prescribed time.

Uses:
- Puppeteer
 
### Stock Watch
Gets stock quotes from Google Finance

Uses:
- Google Sheets API
