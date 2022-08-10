// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;


// erc-20 interface so the contract can interact withn it
interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}


// start our the contract
contract fashionMarketplace {

    // initialize length of fashion places
    uint internal fashionPlacesLength = 0;
    // cUSD token address
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    // group fashion place details
    struct FashionPlace {
        address payable owner;
        string name;
        string image;
        string description;
        string location;
        uint price;
        bool available;
    }


    // map each fashion place to an unsigned integer
    mapping (uint => FashionPlace) internal fashionPlaces;

    //Modifier to check if the caller is the owner
    modifier onlyOwner(uint _index){
        require(msg.sender == fashionPlaces[_index].owner, "Only the owner can access this functionality");
        _;
    }

    // write new fashion place to the contract
    function writeFashionPlace(
        string memory _name,
        string memory _image,
        string memory _description, 
        string memory _location, 
        uint _price
    ) public {
        bool _available = true;
        fashionPlaces[fashionPlacesLength] = FashionPlace(
            payable(msg.sender),
            _name,
            _image,
            _description,
            _location,
            _price,
            _available
        );
        fashionPlacesLength++;
    }

    // read new fashion place from smartcontract
    function readFashionPlace(uint _index) public view returns (
        address payable,
        string memory, 
        string memory, 
        string memory, 
        string memory, 
        uint, 
        bool
    ) {
        return (
            fashionPlaces[_index].owner,
            fashionPlaces[_index].name, 
            fashionPlaces[_index].image, 
            fashionPlaces[_index].description, 
            fashionPlaces[_index].location, 
            fashionPlaces[_index].price,
            fashionPlaces[_index].available
        );
    }

    // function to order or book a fashion place
    function orderFashionPlace(uint _index) public payable  {
        //Checks if the fashion place is available
        require(fashionPlaces[_index].available, "fashion place not available");
        require(msg.sender != fashionPlaces[_index].owner, "Owner can't buy fashion place");
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            fashionPlaces[_index].owner,
            fashionPlaces[_index].price
          ),
          "Transfer failed."
        );
    
    }
    
    // get length of fashion place
    function getFashionPlacesLength() public view returns (uint) {
        return (fashionPlacesLength);
    }

    // set fashion place available or not
    function toggleAvailability(uint _index) public onlyOwner(_index){
        fashionPlaces[_index].available = !fashionPlaces[_index].available;
    }

    //Change the price of the fashion place
    function changePrice(uint _index, uint _price) public onlyOwner(_index){
        fashionPlaces[_index].price = _price;
    }
}
