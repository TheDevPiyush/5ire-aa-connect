"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getProviderAndSigner, getFundraiserContract, getErc20Contract } from "./fundraiserUtility";

export default function Donate() {
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("");
    const [donors, setDonors] = useState([]);

    const [ERC20_TOKEN_ADDRESS, SET_ERC20_TOKEN_ADDRESS] = useState('0xf102648D6aCa7F979D2cE08783B11dB8EDC9E9cC');

    const fetchDonors = async () => {
        try {
            setMessage("Fetching donors...");
            const { signer } = await getProviderAndSigner();
            const fundraiser = await getFundraiserContract(signer);
            const erc20 = await getErc20Contract(signer, ERC20_TOKEN_ADDRESS);

            const donorAddresses = await fundraiser.getDonors();
            const donorDetails = await Promise.all(
                donorAddresses.map(async (donor) => {
                    const donationAmount = await fundraiser.getDonation(donor, erc20.target);
                    return {
                        address: donor,
                        amount: ethers.formatUnits(donationAmount, 18),
                    };
                })
            );
            setDonors(donorDetails);
            setMessage("Donors fetched successfully!");
        } catch (error) {
            console.error(error);
            setMessage("Failed to fetch donors.");
        }
    };

    const handleWithdraw = async () => {
        try {
            setMessage("Checking contract balance...");
            const { signer } = await getProviderAndSigner();
            const fundraiser = await getFundraiserContract(signer);
            const erc20 = await getErc20Contract(signer, ERC20_TOKEN_ADDRESS);

            const contractBalance = await erc20.balanceOf("0x279636B044B83B9a6f4949eCFfE849a9cdc5E81f");
            if (contractBalance.toString() === "0") {
                setMessage("No funds available to withdraw.");
                return;
            }

            setMessage("Withdrawing funds...");
            const withdrawTx = await fundraiser.withdraw(ERC20_TOKEN_ADDRESS);
            await withdrawTx.wait();

            setMessage("Funds withdrawn successfully!");
        } catch (error) {
            console.error(error);
            setMessage("Only the owner can withdraw funds!");
        }
    };

    const handleDonate = async () => {
        try {
            setMessage("Connecting to MetaMask...");
            const { signer } = await getProviderAndSigner();

            const fundraiser = await getFundraiserContract(signer);
            const erc20 = await getErc20Contract(signer, ERC20_TOKEN_ADDRESS);

            const donationAmount = ethers.parseUnits(amount, 18);

            setMessage("Approving tokens...");
            const approveTx = await erc20.approve(fundraiser.target, donationAmount);
            await approveTx.wait();

            setMessage("Donating tokens...");
            const donateTx = await fundraiser.donate(erc20.target, donationAmount);
            await donateTx.wait();

            setMessage(`Donation of ${amount} tokens successful!`);
            setTimeout(() => {
                fetchDonors();
            }, 1500);
        } catch (error) {
            console.error(error);
            setMessage("Donation Failed. Make sure the Address is correct and that you have tokens in your wallet balance");
        }
    };

    useEffect(() => {
        fetchDonors();
    }, []);

    return (
        <div className="font-bold font-mono" style={{ padding: "2rem", textAlign: "center" }}>
            <h1 className="text-2xl mb-9">Donate to Fundraiser</h1>

            <label htmlFor="token">Please provide the address of your custom ERC20 Token you have in your wallet. (Current PIY) :</label>
            <br />
            <input
                id="token"
                className="text-white rounded-full bg-gray-600 focus:bg-gray-500 text-lg"
                type="text"
                placeholder="Contract Address"
                value={ERC20_TOKEN_ADDRESS}
                onChange={(e) => SET_ERC20_TOKEN_ADDRESS(e.target.value)}
                style={{ padding: "0.5rem", margin: "1rem 0" }}
            />

            <br />
            <br />

            <label htmlFor="amount">Please Enter Amount of tokens to donate :</label>
            <br />
            <input
                id="amount"
                className="text-white rounded-full bg-gray-600 focus:bg-gray-500 text-lg"
                type="number"
                placeholder="Token Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ padding: "0.5rem", margin: "1rem 0" }}
            />
            <br />

            <div className="flex gap-3 w-full justify-center items-center my-5">

                <button
                    className="bg-blue-500 rounded-lg hover:bg-blue-600"
                    onClick={handleDonate}
                    style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
                >
                    Donate
                </button>

                <button
                    className="bg-red-500 rounded-lg hover:bg-red-600"
                    onClick={handleWithdraw}
                    style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
                >
                    Withdraw Funds
                </button>

            </div>
            <p className="my-7 text-amber-400">{message}</p>

            {/* Donors Table */}
            <h2 className="text-xl mt-6">Donors</h2>
            <table className="w-full border-collapse border border-gray-300 mt-4">
                <thead>
                    <tr className="text-green-500 text-lg">
                        <th className="border px-4 py-2">#</th>
                        <th className="border px-4 py-2">Donor Address</th>
                        <th className="border px-4 py-2">Donation Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {donors.length === 0 ? (
                        <tr>
                            <td colSpan="3" className="text-center border px-4 py-2">
                                No donors yet.
                            </td>
                        </tr>
                    ) : (
                        donors.map((donor, index) => (
                            <tr key={index}>
                                <td className="border px-4 py-2">{index + 1}</td>
                                <td className="border px-4 py-2">{donor.address}</td>
                                <td className="border px-4 py-2">{donor.amount}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>


        </div>
    );
}
