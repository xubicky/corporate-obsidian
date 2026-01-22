import requests
import time

# Fetch top 5 geopolitical news for Canada or US today
# Geopolitical themes: diplomacy, sanctions, tariffs, trade agreements, foreign policy
url = "https://api.gdeltproject.org/api/v2/doc/doc"

# Query for geopolitical topics in US or Canada, English language, last 24 hours
params = {
    "query": "(United States OR Canada OR US OR American OR Canadian) AND (geopolitical OR diplomacy OR sanctions OR tariff OR trade war OR foreign policy OR treaty OR summit OR bilateral OR NATO OR G7) sourcelang:english",
    "mode": "artlist",
    "maxrecords": "5",
    "format": "json",
    "timespan": "24h",  # Last 24 hours
    "sort": "hybridrel"  # Sort by relevance
}

print("Fetching top 5 geopolitical news for Canada/US today...\n")
print("=" * 70)

response = requests.get(url, params=params)

if response.status_code == 429:
    print("Rate limited - waiting 5 seconds and retrying...")
    time.sleep(5)
    response = requests.get(url, params=params)

if response.status_code == 200:
    try:
        data = response.json()
        articles = data.get("articles", [])
        
        if articles:
            for i, article in enumerate(articles, 1):
                print(f"\n📰 Article {i}:")
                print(f"   Title: {article.get('title', 'N/A')}")
                print(f"   Source: {article.get('domain', 'N/A')} ({article.get('sourcecountry', 'N/A')})")
                print(f"   Date: {article.get('seendate', 'N/A')}")
                print(f"   URL: {article.get('url', 'N/A')}")
                print("-" * 70)
        else:
            print("No articles found matching the criteria.")
            
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        print(f"Raw response: {response.text[:500]}")
else:
    print(f"Error: Status Code {response.status_code}")
    print(f"Response: {response.text}")