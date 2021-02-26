---
title:  "Selenium + Python를 사용할 때 유용한 코드 몇 개"
excerpt: "자동화 테스트를 할 때 필요할지도 모를 코드를 모아 봤습니다."
date: 2021-02-20 08:20:00+0900
categories:
  - python
tags:
  - python
  - code
  - selenium
---

[Selenium](https://www.selenium.dev)은 브라우저 자동화 테스트를 지원하는 프레임워크입니다. 만든 웹사이트 동작을 확인하거나 반복 작업을 줄이고 싶을 때 좋은 도구이지요. 그런 Selenium을 사용할 때 알아두면 좋은 코드를 몇 개 소개합니다.

## 시작하기 전에

Selenium은 여러 프로그래밍 언어를 사용할 수 있지만 여기서는 파이썬 코드를 소개합니다.

## 마우스 휠 동작 흉내내기

출처: [Mouse scroll wheel with selenium webdriver, on element without scrollbar?](https://stackoverflow.com/questions/47274852/mouse-scroll-wheel-with-selenium-webdriver-on-element-without-scrollbar)

```python
def wheel_element(element, deltaY=120, offsetX=0, offsetY=0):
    error = element._parent.execute_script("""
        var element = arguments[0];
        var deltaY = arguments[1];
        var box = element.getBoundingClientRect();
        var clientX = box.left + (arguments[2] || box.width / 2);
        var clientY = box.top + (arguments[3] || box.height / 2);
        var target = element.ownerDocument.elementFromPoint(clientX, clientY);

        for (var e = target; e; e = e.parentElement) {
        if (e === element) {
            target.dispatchEvent(new MouseEvent('mouseover', {view: window, bubbles: true, cancelable: true, clientX: clientX, clientY: clientY}));
            target.dispatchEvent(new MouseEvent('mousemove', {view: window, bubbles: true, cancelable: true, clientX: clientX, clientY: clientY}));
            target.dispatchEvent(new WheelEvent('wheel',     {view: window, bubbles: true, cancelable: true, clientX: clientX, clientY: clientY, deltaY: deltaY}));
            return;
        }
        }    
        return "Element is not interactable";
        """, element, deltaY, offsetX, offsetY)
    if error:
        #raise WebDriverException(error)
        logger.debug("fail to scroll")

    return

# 마우스 휠 위로
wheel_element(elm, -120)
# 마우스 휠 아래로
wheel_element(elm, 120)
```

## 브라우저에 저장된 blob 저장하기

출처: [How to download an image with Python 3/Selenium if the URL begins with “blob:”?](https://stackoverflow.com/questions/47424245/how-to-download-an-image-with-python-3-selenium-if-the-url-begins-with-blob)

```python
def get_file_content_chrome(driver, uri):
    result = driver.execute_async_script("""
        var uri = arguments[0];
        var callback = arguments[1];
        var toBase64 = function(buffer){for(var r,n=new Uint8Array(buffer),t=n.length,a=new Uint8Array(4*Math.ceil(t/3)),i=new Uint8Array(64),o=0,c=0;64>c;++c)i[c]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charCodeAt(c);for(c=0;t-t%3>c;c+=3,o+=4)r=n[c]<<16|n[c+1]<<8|n[c+2],a[o]=i[r>>18],a[o+1]=i[r>>12&63],a[o+2]=i[r>>6&63],a[o+3]=i[63&r];return t%3===1?(r=n[t-1],a[o]=i[r>>2],a[o+1]=i[r<<4&63],a[o+2]=61,a[o+3]=61):t%3===2&&(r=(n[t-2]<<8)+n[t-1],a[o]=i[r>>10],a[o+1]=i[r>>4&63],a[o+2]=i[r<<2&63],a[o+3]=61),new TextDecoder("ascii").decode(a)};
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(){ callback(toBase64(xhr.response)) };
        xhr.onerror = function(){ callback(xhr.status) };
        xhr.open('GET', uri);
        xhr.send();
        """, uri)
    if type(result) == int:
        raise Exception("Request failed with status %s" % result)
    return base64.b64decode(result)

# 저장하기
bytes2 = get_file_content_chrome(driver, res_url)
with open(filepath, 'wb') as binary_file:
    binary_file.write(bytes2)
    binary_file.flush()

```

## iframe 전환하기

```python
target_iframe="전환하기 원하는 iframe 엘리먼트 ID"
for iframe in driver.find_elements_by_tag_name('iframe'):
    try:
        id_info = iframe.get_attribute('id')
        if target_iframe == id_info:
            driver.switch_to.frame(iframe)
            break
    except:
        # back to original frame
        driver.switch_to_default_content()
```

## 크롬 퍼포먼스 로그 확인하기

브라우저에서 주고 받는 네트워크 트래픽 정보를 확인할 수 있습니다.

```python
# 필요 정보만 추출
def process_browser_log_entry(entry):
    response = json.loads(entry['message'])['message']
    return response

# 로그 기능 활성화
caps = DesiredCapabilities.CHROME
caps['loggingPrefs'] = {'performance': 'ALL'}
caps['goog:loggingPrefs'] = {'performance': 'ALL'}

driver = webdriver.Chrome(CHROME_DRV_PATH, desired_capabilities=caps)

# get performance logs
browser_log = driver.get_log('performance')
events = [process_browser_log_entry(entry) for entry in browser_log]
for event in events:
    print(event)
```

## JSON 보기 좋게 출력하기

```python
# ensure_ascii=False로 하면 유니코드로 제대로 출력
print(json.dumps(json_data, ensure_ascii=False, indent=2))
```
