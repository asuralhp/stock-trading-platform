import torch
import model
import torch.nn as nn
import sys

# Load checkpoint (map to CPU by default so this works on any machine)
ckpt_path = 'lstm_price_model.pth'
try:
	ckpt = torch.load(ckpt_path, map_location='cpu')
except Exception as e:
	print(f"Failed to load checkpoint '{ckpt_path}': {e}")
	sys.exit(1)

# Inspect checkpoint to determine saved input / hidden sizes
sd = ckpt.get('model_state_dict', ckpt)

def _find_param(shape_first_dim_name='W_i'):
	# Try direct key then try suffix search
	if shape_first_dim_name in sd:
		return sd[shape_first_dim_name].shape
	for k, v in sd.items():
		if k.endswith(shape_first_dim_name):
			return v.shape
	return None

wi_shape = _find_param('W_i')
if wi_shape is None:
	print("Could not find W_i in checkpoint state_dict keys. Keys:\n", list(sd.keys())[:20])
	sys.exit(1)

saved_input_sz, saved_hidden_sz = int(wi_shape[0]), int(wi_shape[1])
print(f"Checkpoint saved model input size: {saved_input_sz}, hidden size: {saved_hidden_sz}")

# Recreate model with matching dimensions
net = model.NaiveCustomLSTM(input_sz=saved_input_sz, hidden_sz=saved_hidden_sz)
head = nn.Linear(saved_hidden_sz, 1)

# Attempt to load state dicts
try:
	missing_unexpected = net.load_state_dict(sd, strict=True)
except RuntimeError as e:
	print("Strict loading failed with error:\n", e)
	print("Attempting non-strict load (will keep randomly initialized params where shapes differ)")
	missing_unexpected = net.load_state_dict(sd, strict=False)

# Load head state dict if present
if 'head_state_dict' in ckpt:
	try:
		head.load_state_dict(ckpt['head_state_dict'])
	except Exception:
		print("Warning: couldn't fully load head_state_dict; skipping strict load for head.")

net.eval(); head.eval()
print("Model and head loaded (or partially loaded). Quick sanity check below.")

# quick forward pass to verify shapes
with torch.no_grad():
	seq_len = globals().get('SEQ_LEN', 60)
	x = torch.randn(2, seq_len, saved_input_sz)
	out_seq, (h_t, c_t) = net(x)
	preds = head(out_seq[:, -1, :])
	print("Forward shapes -> out_seq:", out_seq.shape, "preds:", preds.shape)

	# Show the first sample's input sequence and the model prediction for it
	sample_idx = 0
	sample_input = x[sample_idx].cpu().numpy()        # shape: (seq_len, input_size)
	sample_pred = preds[sample_idx].cpu().numpy()     # shape: (1,)

	print('\nSample input (first sequence, shape {}):'.format(sample_input.shape))
	# print a compact view: first 6 and last 6 timesteps if long
	if sample_input.shape[0] > 12:
		print('first 6 timesteps:\n', sample_input[:6].squeeze())
		print('...')
		print('last 6 timesteps:\n', sample_input[-6:].squeeze())
	else:
		print(sample_input.squeeze())

	print('\nModel prediction for that sample (raw):', sample_pred.squeeze())

	# If checkpoint contains scaling params, attempt to unscale output for readability
	if isinstance(ckpt, dict) and 'scale_denom' in ckpt and 'train_min' in ckpt:
		try:
			sd = torch.tensor(ckpt['scale_denom'], dtype=preds.dtype)
			tm = torch.tensor(ckpt['train_min'], dtype=preds.dtype)
			# ensure shapes align
			if sd.ndim == 1:
				sd = sd.reshape(1, -1)
			if tm.ndim == 1:
				tm = tm.reshape(1, -1)
			pred_unscaled = sample_pred * sd.cpu().numpy() + tm.cpu().numpy()
			print('\nModel prediction (unscaled, attempt):', pred_unscaled.squeeze())
		except Exception:
			print('\nFound scale params in checkpoint but failed to unscale safely.')