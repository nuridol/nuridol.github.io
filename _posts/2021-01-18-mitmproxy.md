---
title:  "mitmproxy로 스트리밍 다운로드 해보기"
excerpt: "mitmproxy용 스크립트로 모바일 기기에서 본 스트리밍 영상을 자동으로 저장해봅시다."
date: 2021-01-18 09:00:00+0900
categories:
  - python
tags:
  - mitmproxy
  - debugging
  - proxy
  - python
  - command
---

모바일앱 디버깅에 자주 사용하는 mitmproxy 기능을 활용해서 지금 폰으로 보고 있는 영상을 다운로드하는 스크립트 예제를 만들어 봤습니다.

## 시작하기 전에

예전에 사용하던 Burp 인증서를 그대로 활용하려면 변환 과정이 필요합니다.
`openssl` 명령어로 pem 형식으로 변환합니다.

## 소스 코드

요청과 응답에서 각각 필요한 정보를 따서 스트리밍을 저장하는 명령어를 호출하는 스크립트입니다.
자세한 설명은 생략합니다.

{% gist nuridol/0decdece8c5bf86789b7229a9d7a7c58 %}
