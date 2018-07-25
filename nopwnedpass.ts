class PasswordGuard {
  passFields: NodeListOf<HTMLElement>

  constructor () {
    this.passFields = document.querySelectorAll('input[type=password]')
  }

  async sha1 (str: string) {
    const msgBuffer = new TextEncoder().encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('').toUpperCase()
  }

  checkPwned (hash: string) {
    let hashPrefix = hash.substr(0,5)
    let hashMatch = fetch('https://api.pwnedpasswords.com/range/'+hashPrefix, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    }).then(
      (response) => {return response.text()}
    ).then(
      (str) => {return str.replace(/:\d+/g, '').split("\r\n")}
    )

    hashMatch.then((array) => {
      if (array.indexOf(hash.substring(5)) === -1) {
        this.isPwned(false)
      } else {
        this.isPwned(true)
      }
    })
  }

  isPwned (pwned: boolean) {
    let notifIcon, notifTitle, notifMsg

    if (pwned) {
      let notifIcon = browser.extension.getURL("icons/npp-pwned.png")
      notifTitle = 'Oh no! Pwned password!'
      notifMsg = 'You just used a password on ' + window.location.hostname + ' that\'s been in a data breach. You should consider that password insecure and change it.'
    } else {
      notifIcon = browser.extension.getURL("icons/npp-notpwned.png")
      notifTitle = 'Hooray! Good password!'
      notifMsg = 'You just used a password on ' + window.location.hostname + ' that\'s not known to have been in any data breach.'
    }

    let notification = browser.notifications.create(window.location.hostname, {
      "type": "basic",
      "iconUrl": notifIcon,
      "title": notifTitle,
      "message": notifMsg
    })
  }

  test () {
    console.warn('TESTING')
    this.sha1('password').then(hash => this.checkPwned(hash))
  }
}

(() => {
  console.info("No Pwned Passwords Shall Pass!")

  let passwordGuard = new PasswordGuard()
  passwordGuard.test()
})()