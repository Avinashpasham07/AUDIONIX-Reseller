import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CartContext from '../context/CartContext';

import { FaTrash, FaShieldAlt } from 'react-icons/fa';

const Cart = () => {
    const { cart, removeFromCart, getCartTotal, updateQuantity } = useContext(CartContext);
    const [margin, setMargin] = useState(0);
    const navigate = useNavigate();

    const handleProceed = () => {
        if (cart.length === 0) return;

        // Strict MOQ Validation Check
        const invalidItems = cart.filter(item => item.quantity < (item.moq || 1));
        if (invalidItems.length > 0) {
            // Show alert for first invalid item
            const firstItem = invalidItems[0];
            alert(`Minimum order quantity for "${firstItem.title}" is ${firstItem.moq} units. Please increase quantity.`);
            return;
        }

        navigate('/checkout', { state: { margin } });
    };

    if (cart.length === 0) {
        return (

            <div className="flex-center border border-zinc-800 rounded-3xl m-4 bg-zinc-900" style={{ height: '50vh', flexDirection: 'column' }}>
                <div className="text-6xl mb-4">🛒</div>
                <h2 className="text-white font-bold text-2xl">Your Cart is Empty</h2>
                <p className="text-zinc-400 mt-2">Add items to it now.</p>
                <button onClick={() => navigate('/products')} className="mt-4 px-8 py-3 bg-red-600 text-white border-0 rounded-xl cursor-pointer font-bold hover:bg-red-700 transition">Shop Now</button>
            </div>
        );
    }

    return (
        <div className="bg-black min-h-screen py-8 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* LEFT COLUMN: Cart Items */}
                <div className="lg:col-span-2">
                    <div className="glass-panel rounded-2xl border border-zinc-800 overflow-hidden">
                        <div className="p-4 border-b border-zinc-800">
                            <h3 className="m-0 font-bold text-lg text-white">My Cart ({cart.length})</h3>
                        </div>

                        {cart.map((item) => (
                            <div key={item._id} className="flex flex-col sm:flex-row p-6 border-b border-zinc-800 gap-4">
                                <div className="w-28 h-28 flex-shrink-0 mx-auto sm:mx-0 bg-zinc-900 rounded-xl p-2 border border-zinc-800">
                                    <img src={item.images?.[0] || 'https://via.placeholder.com/150'} alt={item.title} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-base font-bold text-white mb-2 text-center sm:text-left">{item.title}</div>
                                    <div className="text-sm text-zinc-400 mb-2 text-center sm:text-left">
                                        Seller: Audionix Verified  | <span className="text-orange-500 font-bold">Min Order: {item.moq || 1}</span>
                                    </div>

                                    <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold text-white">₹{item.price} <span className="text-zinc-500 text-xs font-normal">/ unit</span></span>
                                            {item.quantity > 1 && (
                                                <span className="text-sm font-bold text-green-500">Total: ₹{item.price * item.quantity}</span>
                                            )}
                                        </div>
                                        <span className="text-green-500 text-sm font-medium">Free Delivery</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                disabled={item.quantity <= (item.moq || 1)}
                                                className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 text-white flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700"
                                            > - </button>
                                            <div className="w-10 text-center border border-zinc-700 bg-zinc-900 text-white py-0.5 rounded-md">{item.quantity}</div>
                                            <button
                                                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 text-white flex items-center justify-center cursor-pointer hover:bg-zinc-700"
                                            > + </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item._id)}
                                            className="text-sm font-semibold text-zinc-400 uppercase hover:text-red-500 transition"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="p-6 flex justify-end sticky bottom-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 shadow-[0_-2px_10px_rgba(0,0,0,0.5)]">
                            <button
                                onClick={handleProceed}
                                className="bg-red-600 text-white border-none py-3 px-12 text-base font-bold rounded-lg cursor-pointer hover:bg-red-700 transition shadow-md w-full sm:w-auto"
                            >
                                PLACE ORDER
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Price Details */}
                <div>
                    <div className="glass-panel rounded-2xl border border-zinc-800 overflow-hidden">
                        <div className="p-4 border-b border-zinc-800 text-zinc-400 font-bold uppercase text-sm">
                            Price Details
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between mb-4 text-white">
                                <div>Price ({cart.length} items)</div>
                                <div>₹{getCartTotal()}</div>
                            </div>
                            <div className="flex justify-between mb-4">
                                <div className="text-white">Delivery Charges</div>
                                <div className="text-green-500 font-medium">FREE</div>
                            </div>

                            {/* Reseller Margin Section */}
                            <div className="border-t border-dashed border-zinc-800 my-4 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm text-zinc-400">Your Margin (Profit)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={margin}
                                        onChange={(e) => setMargin(Number(e.target.value))}
                                        placeholder="₹0"
                                        className="w-24 p-2 text-right border border-zinc-700 bg-zinc-900 text-white rounded-md outline-none focus:ring-1 focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-zinc-800 border-b py-4 flex justify-between font-bold text-lg text-white">
                                <div>Total Amount</div>
                                <div>₹{getCartTotal() + margin}</div>
                            </div>

                            <div className="mt-4 text-green-500 text-sm font-medium">
                                You will save extra using Audionix.
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </div>

    );
};

export default Cart;
