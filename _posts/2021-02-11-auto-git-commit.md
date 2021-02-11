---
title:  "Git 자동 커밋하기 스크립트"
excerpt: "개발 환경에서 잊지 않고 커밋하려면"
date: 2021-02-11 21:00:00+0900
categories:
  - command
tags:
  - git
  - command
---

요즘은 Git이 거의 표준인 소스 코드 관리 프로그램이지요. 개인 프로젝트를 할 때라도 3일 뒤 나를 위해서라도 수정한 코드를 잊지 않고 커밋하는 습관을 들이면 좋지만 매번 하려니 귀찮다면 `cron`에 등록해서 매일 알아서 커밋하는 방법도 있습니다.

## 시작하기 전에

crontab 설정법은 [crontab guru](https://crontab.guru) 페이지를 살펴 보세요.

## shell script 파일

{% gist nuridol/e5b6690ac22e148d5646f03c1f73b39f %}
