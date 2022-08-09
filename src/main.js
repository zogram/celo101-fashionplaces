import Web3 from "web3"
import { newKitFromWeb3 } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import marketplaceAbi from "../contract/marketplace.abi.json"
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const MPContractAddress = "0x2d758Fc98bb06baDb93Cf7B73Dc24672410d4eE9"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

// declared global variables
let kit 
let contract
let fashionPlaces = []
let boolAvailability

// function to connect celo wallet
const connectCeloWallet = async function () {
  if (window.celo) {
    notification("Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notificationOff()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]
      

      contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}


// approve booking
async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(MPContractAddress, _price)
    .send({ from: kit.defaultAccount })
  return result
}


// get users celo wallet balance
const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}


// get fashion places from the contract
const getFashionPlaces = async function() {
  const _fashionPlacesLength = await contract.methods.getFashionPlacesLength().call()
  const _fashionPlaces = []
  for (let i = 0; i < _fashionPlacesLength; i++) {
    let _fashionPlace = new Promise(async (resolve, reject) => {
      let p = await contract.methods.readFashionPlace(i).call()
      resolve({
        index: i,
        owner: p[0],
        name: p[1],
        image: p[2],
        description: p[3],
        location: p[4],
        price: new BigNumber(p[5]),
        contractAvailability: p[6],
      })
    })
    _fashionPlaces.push(_fashionPlace)
  }
  fashionPlaces = await Promise.all(_fashionPlaces)
  renderFashionPlaces()
}

// display fashion place in the UI
function renderFashionPlaces() {
  document.getElementById("fashionPlace").innerHTML = ""
  fashionPlaces.forEach((_fashionPlace) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = fashionPlaceTemplate(_fashionPlace)
    document.getElementById("fashionPlace").appendChild(newDiv)
  })
}

// template for fashion place UI
function fashionPlaceTemplate(_fashionPlace) {
  let availability
  let radioButttonId
  let checked
  let enableBookBtn
  boolAvailability = _fashionPlace.contractAvailability;

  // condition to check availability of fashion place, this determine what is displayed on the UI
  if(boolAvailability) {
    availability = 'Available'
    radioButttonId = "flexSwitchCheckChecked"
    checked="checked"
    enableBookBtn= ""
  } else {
    availability = 'Not available'
    radioButttonId = "flexSwitchCheckChecked"
    checked=""
    enableBookBtn='pe-none'
  }

  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_fashionPlace.image}" alt="...">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
        ${availability}
      </div>
      <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_fashionPlace.owner)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_fashionPlace.name}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_fashionPlace.description}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${_fashionPlace.location}</span>
        </p>
        <div class="form-check form-switch"  id=${
          _fashionPlace.index
        }>
          <input class="form-check-input" type="checkbox" id=${radioButttonId} data-id=${
            _fashionPlace.index
          } ${checked}>
          <label class="form-check-label" for=${radioButttonId}>Availabilty</label>
        </div>
        <div class="d-grid gap-2 ${enableBookBtn}">
          <a class="btn btn-lg btn-outline-dark bookBtn fs-6 p-3" id=${
            _fashionPlace.index
          }>
            Book for ${_fashionPlace.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD
          </a>
        </div>
      </div>
    </div>
  `

}


// template to generate identicon
function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `
}

// displays notification
function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

// hides notification
function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}


// function to run when web page loads
window.addEventListener("load", async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  await getFashionPlaces()
  notificationOff()
});

// add new fashion place
document
  .querySelector("#newFashionPlaceBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newFashionPlaceName").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newFashionPlaceDescription").value,
      document.getElementById("newLocation").value,
      new BigNumber(document.getElementById("newPrice").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString()
    ]
    notification(`⌛ Adding "${params[0]}"...`)
    try {
      const result = await contract.methods
        .writeFashionPlace(...params)
        .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added "${params[0]}".`)
    getFashionPlaces()
  })

  // book fashion place
  document.querySelector("#fashionPlace").addEventListener("click", async (e) => {
    if (e.target.className.includes("bookBtn")) {
      const index = e.target.id
      notification("⌛ Waiting for payment approval...")
      try {
        await approve(fashionPlaces[index].price)
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
      notification(`⌛ Awaiting payment for "${fashionPlaces[index].name}"...`)
      try {
        const result = await contract.methods
          .orderFashionPlace(index)
          .send({ from: kit.defaultAccount })
        notification(`🎉 You successfully bought "${fashionPlaces[index].name}".`)
        getFashionPlaces()
        getBalance()
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
    }
  })  

  // check and change availability
  document.querySelector("#fashionPlace").addEventListener("click", async (e) => {
    if (e.target.className.includes("form-check-input")) {
      const index = e.target.dataset.id

      notification("⌛ changing availability...")
      try {
        const availability = await contract.methods
          .availability(index)
          .send({ from: kit.defaultAccount })
        
        notification(`🎉 You successfully changed your availability".`)
        getFashionPlaces()
        getBalance()
      
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
    }
  }) 
  
  
  