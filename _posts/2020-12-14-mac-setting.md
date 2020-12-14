---
title:  "Mac OS의 숨은 설정 옵션을 지정하는 defaults 명령어"
excerpt: "defaults 명령어로 숨은 설정 지정해보기"
date: 2020-12-14 15:00:00+0900
categories:
  - command
tags:
  - macos
  - shell
  - command
---

Mac OS는 깔끔하고 정돈된 GUI가 유명하지만 그런 만큼 환경 설정 화면에서 찾을 수 없는 숨은 옵션도 꽤 있는 편입니다. 그런 옵션 중에 유용할 수도 있는 옵션을 몇 가지 알아 봅시다.

## 기본앱 관련 설정

### 숨긴 앱을 독에서 반투명하게 표시하기

![Dim jidden mac apps on the Dock](https://user-images.githubusercontent.com/1617715/102049573-75bd0a00-3e24-11eb-8858-4df29c305c89.png)

```bash
defaults write com.apple.Dock showhidden -bool yes; killall Dock
```

이 명령어를 실행하면 `⌘+H` 키를 눌러 화면에서 숨긴 앱이 독에 반투명하게 표시됩니다.

### 재부팅해도 전에 열었던 파인더 탭을 유지하기

```bash
defaults write com.apple.finder NSQuitAlwaysKeepsWindows -bool true
```

환경 설정의 General에 있는 **Close windows when quitting an app** 체크를 해제해도 되지만 다른 앱들은 모두 닫아도 파인더는 유지하고 싶으면 위 명령어를 실행하면 됩니다. 때에 따라서는 제대로 저장이 안될 때도 있지만요.

`com.apple.finder` 부분에 상태를 저장하고 싶은 앱 ID를 대신 넣어도 사용 가능합니다.

### 파일 다이얼로그를 늘 확장한 형태로 열기

```bash
defaults write NSGlobalDomain NSNavPanelExpandedStateForSaveMode -bool true && defaults write NSGlobalDomain NSNavPanelExpandedStateForSaveMode2 -bool true
```

파일을 열거나 저장할 때 열리는 창을 늘 확장한, 즉 경로나 폴더 위치를 목록으로 표시하는 상태로 만들어 주는 옵션입니다.

### 네트워크 드라이브나 USB에 맥용 숨은 파일 만들지 않기

```bash
defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool true
defaults write com.apple.desktopservices DSDontWriteUSBStores -bool true
```

맥에서 작업하던 USB를 윈도에 가져가서 확인해보면 만든 적도 없는 .DS_store 같은 파일이나 폴더가 생겨 있는 걸 경험해본 적이 있을 겁니다.

이런 파일은 메타 정보를 관리하기 위해 사용하지만 다른 OS에서는 필요하지 않고, 없어도 사용에는 큰 지장이 없으므로 다른 OS에서 사용하는 빈도가 잦은 네트워크 드라이브나 USB에 그런 파일을 작성하지 않도록 설정하는 명령어입니다.

### 배터리 남은 잔량 % 표시하기

```bash
defaults write com.apple.menuextra.battery ShowPercent -string "YES"
```

최신 OS에서도 가능한지는 테스트해보지 않았습니다.

### 충돌 보고서 사용하지 않기

```bash
defaults write com.apple.CrashReporter DialogType none
```

앱이 갑자기 충돌이 나서 실행 종료되고 나면 보고서를 보내겠냐고 물어보는 창이 나오는데 매번 표시되면 좀 귀찮습니다. 그런 창이 출력되지 않게 하는 명령어입니다.



## 정리

그외에도 유용한 옵션이 있으니 다음 링크를 확인해 보거나 *mac os defaults write* 키워드로 검색해 보세요.

- [https://qiita.com/REGO350/items/959d6a7f767021acaf42](https://qiita.com/REGO350/items/959d6a7f767021acaf42)
- [https://gist.github.com/atadams/3085530](https://gist.github.com/atadams/3085530)
