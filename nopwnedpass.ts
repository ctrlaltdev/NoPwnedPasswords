class PasswordGuard {
  passFields: NodeListOf<HTMLElement>

  constructor () {
    this.passFields = document.querySelectorAll('input[type=password]');
    [].forEach.call(this.passFields, (passField: HTMLElement) => {
      let parentForm: HTMLElement | null = passField.parentElement
      while (parentForm.tagName !== 'FORM') {
        parentForm = parentForm.parentElement
      }
      this.bindSubmit(parentForm)
    })
  }

  async sha1 (str: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('').toUpperCase()
  }

  checkPwned (hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
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
          resolve(false)
        } else {
          resolve(true)
        }
      })
    })
  }

  bindSubmit (form: HTMLElement) {
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.liveCheck(e)
    })
  }

  liveCheck (e: Event) {
    let form: HTMLElement = e.target
    let passwdInput: HTMLElement = form.querySelector('input[type=password]')
    let hash = this.sha1(passwdInput.value)

    hash.then((hash) => {
      let pwned = this.checkPwned(hash)
      pwned.then((pwned) => {
        if (pwned) {
          passwdInput.setCustomValidity('The password you used has been in a data breach. DO NOT use it and change your password on every sites you used it.')
        } else {
          passwdInput.setCustomValidity('')
          form.submit()
        }
      })
    })
  }
}

(() => {
  console.info("No Pwned Passwords Shall Pass!")

  window.setTimeout(() => {
    let passwordGuard = new PasswordGuard()
  }, 1000)
})()