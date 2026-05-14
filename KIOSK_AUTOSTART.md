# Firefox kiosk autostart on Raspberry Pi / Labwc

This project is deployed on a machine that auto-logs into a Labwc-based desktop session and launches Firefox in kiosk mode against the local web app.

## Final setup

Firefox is started automatically by the user Labwc autostart file:

`~/.config/labwc/autostart`

Current content:

```sh
touch /tmp/labwc-autostart-ran
bash -lc 'echo "$(date -Is) starting firefox kiosk" >> /tmp/firefox-kiosk.log; if pgrep -u "$(id -un)" -a firefox | grep -F -- "--kiosk http://localhost:8080" >/dev/null 2>&1; then echo "$(date -Is) kiosk already running" >> /tmp/firefox-kiosk.log; exit 0; fi; until nc -z localhost 8080 >/dev/null 2>&1; do sleep 1; done; echo "$(date -Is) launching firefox" >> /tmp/firefox-kiosk.log; exec /usr/bin/firefox --kiosk http://localhost:8080 >> /tmp/firefox-kiosk.log 2>&1' &
```

## What this does

1. Confirms that the user Labwc autostart file has run by creating `/tmp/labwc-autostart-ran`.
2. Writes simple boot diagnostics to `/tmp/firefox-kiosk.log`.
3. Checks whether Firefox is already running in kiosk mode for `http://localhost:8080`.
4. Waits until the local service on port `8080` is available.
5. Launches Firefox with:

```sh
/usr/bin/firefox --kiosk http://localhost:8080
```

## Important detail

The user autostart file does **not** source `/etc/xdg/labwc/autostart`.

That system file is already handled by the Labwc session itself and contains panel / desktop startup such as:

- `pcmanfm-pi`
- `wf-panel-pi`
- `kanshi`
- `lxsession-xdg-autostart`

Keeping the user file limited to Firefox avoids duplicate panel/menu processes during boot.

## Machine assumptions

This setup assumes:

- LightDM is configured to auto-login the user.
- The session used at login is `rpd-labwc`.
- The web app is available on `http://localhost:8080`.
- `firefox` and `nc` are installed on the target machine.

## Quick verification

After reboot:

```sh
ls -l /tmp/labwc-autostart-ran
cat /tmp/firefox-kiosk.log
pgrep -u "$(id -un)" -a firefox
```

Expected result:

- Firefox starts automatically in kiosk mode.
- Only one panel/menu set is visible.
- Log file shows the autostart running and then launching Firefox.
