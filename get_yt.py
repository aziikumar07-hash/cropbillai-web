import urllib.request
try:
    req = urllib.request.Request('https://www.youtube.com/watch?v=TnduiS4kyg8', headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    if "Video unavailable" in html:
        print("Video unavailable")
    elif "This video is private" in html:
        print("Private video")
    else:
        # Just find anything that looks like a title in the JSON ytInitialPlayerResponse
        import re
        m = re.search(r'"title":"(.*?)"', html)
        if m:
            print("Extracted title from JSON:", m.group(1))
        else:
            print("Could not find title. HTML length:", len(html))
except Exception as e:
    print("Error:", e)