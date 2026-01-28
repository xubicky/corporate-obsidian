import urllib.request
import xml.etree.ElementTree as ET

# Fetch latest Axios news via Google News RSS (bypasses Cloudflare on main site)
url = "https://news.google.com/rss/search?q=site:axios.com&hl=en-US&gl=US&ceid=US:en"

print("Fetching latest Axios news...\n")
print("=" * 70)

try:
    # Use urllib which is standard library
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as response:
        if response.status == 200:
            try:
                xml_content = response.read()
                root = ET.fromstring(xml_content)
                channel = root.find("channel")
                items = channel.findall("item")
                
                if items:
                    for i, item in enumerate(items[:10], 1):  # Show top 10
                        title = item.find("title").text if item.find("title") is not None else "N/A"
                        link = item.find("link").text if item.find("link") is not None else "N/A"
                        pub_date = item.find("pubDate").text if item.find("pubDate") is not None else "N/A"
                        
                        # Clean title (Google News often adds " - Axios" at end)
                        if " - Axios" in title:
                            title = title.replace(" - Axios", "")
                            
                        print(f"\n📰 Article {i}:")
                        print(f"   Title: {title}")
                        print(f"   Date: {pub_date}")
                        print(f"   Link: {link}")
                        print("-" * 70)
                else:
                    print("No articles found.")
                    
            except Exception as e:
                print(f"Error parsing XML: {e}")
        else:
            print(f"Error: Status Code {response.status}")

except Exception as e:
    print(f"Connection Error: {e}")