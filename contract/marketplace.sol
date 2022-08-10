// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

// erc-20 interface so the contract can interact withn it
interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

// start our the contract
contract fashionMarketplace {
    // initialize length of fashion places
    uint internal fashionPlacesLength = 0;
    // cUSD token address
    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    // group fashion place details
    struct FashionPlace {
        address payable owner;
        address currentCustomer;
        string name;
        string image;
        string description;
        string location;
        uint price;
        bool available;
        uint unavailableTill;
    }

    // map each fashion place to an unsigned integer
    mapping(uint => FashionPlace) private fashionPlaces;

    modifier onlyPlaceOwner(uint _index) {
        require(
            fashionPlaces[_index].owner == msg.sender,
            "Only fashion place owner"
        );
        _;
    }

    /// @dev this modifier checks if current timestamp is greater or equal to UnavailableTill
    modifier checkOver(uint _index) {
        require(
            block.timestamp >= fashionPlaces[_index].unavailableTill,
            "Fashion place's current booking isn't over"
        );
        _;
    }

    /// @dev write new fashion place to the contract
    function writeFashionPlace(
        string calldata _name,
        string calldata _image,
        string calldata _description,
        string calldata _location,
        uint _price
    ) external {
        require(bytes(_name).length > 0, "Empty name");
        require(bytes(_image).length > 0, "Empty image url");
        require(bytes(_description).length > 0, "Empty description");
        require(bytes(_location).length > 0, "Empty location");
        bool _available = true;
        uint _unavailableTill = 0;
        fashionPlaces[fashionPlacesLength] = FashionPlace(
            payable(msg.sender),
            address(0),
            _name,
            _image,
            _description,
            _location,
            _price,
            _available,
            _unavailableTill
        );
        fashionPlacesLength++;
    }

    /// @dev read a fashion place from smartcontract
    function readFashionPlace(uint _index)
        public
        view
        returns (
            address payable owner,
            address currentCustomer,
            string memory name,
            string memory image,
            string memory description,
            string memory location,
            uint price,
            bool available,
            uint unavailableTill
        )
    {
        owner = fashionPlaces[_index].owner;
        currentCustomer = fashionPlaces[_index].currentCustomer;
        name = fashionPlaces[_index].name;
        image = fashionPlaces[_index].image;
        description = fashionPlaces[_index].description;
        location = fashionPlaces[_index].location;
        price = fashionPlaces[_index].price;
        available = fashionPlaces[_index].available;
        unavailableTill = fashionPlaces[_index].unavailableTill;
    }

    /// @dev function to order or book a fashion place
    ///  @notice fashion place is now unavailable
    function orderFashionPlace(uint _index, uint _time) public payable {
        require(
            fashionPlaces[_index].owner != msg.sender,
            "You can't book your own fashion place"
        );
        require(
            fashionPlaces[_index].available,
            "Fashion place is currently unavailable"
        );
        require(_time > 0, "Duration of booking must be at least one hour");
        fashionPlaces[_index].available = false;
        fashionPlaces[_index].currentCustomer = msg.sender;
        fashionPlaces[_index].unavailableTill = block.timestamp + _time;
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                fashionPlaces[_index].owner,
                fashionPlaces[_index].price
            ),
            "Transfer failed."
        );
    }

    /// @dev allows a fasion place owner to end the order
    function finishOrder(uint _index)
        public
        onlyPlaceOwner(_index)
        checkOver(_index)
    {
        fashionPlaces[_index].unavailableTill = 0;
        fashionPlaces[_index].currentCustomer = address(0);
        fashionPlaces[_index].available = true;
    }

    /// @dev get length of fashion place
    function getFashionPlacesLength() public view returns (uint) {
        return (fashionPlacesLength);
    }

    /// @dev set fashion place available or not
    function setAvailability(uint _index)
        public
        onlyPlaceOwner(_index)
        checkOver(_index)
    {
        fashionPlaces[_index].available = !fashionPlaces[_index].available;
    }
}
