import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

torch.cuda.is_available()

def build_dataset(price_series: torch.Tensor, window_size: int) -> tuple[TensorDataset, torch.Tensor, torch.Tensor]:
    features = []
    targets = []
    for idx in range(len(price_series) - window_size):
        window = price_series[idx : idx + window_size]
        next_price = price_series[idx + window_size]
        features.append(window)
        targets.append(next_price)
    feature_tensor = torch.stack(features).unsqueeze(-1)
    target_tensor = torch.stack(targets).unsqueeze(-1)
    return TensorDataset(feature_tensor, target_tensor), feature_tensor, target_tensor


class PriceLSTM(nn.Module):
    def __init__(self, input_size: int = 1, hidden_size: int = 32, num_layers: int = 2, dropout: float = 0.1) -> None:
        super().__init__()
        self.lstm = nn.LSTM(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers, dropout=dropout)
        self.head = nn.Sequential(nn.Linear(hidden_size, hidden_size // 2), nn.ReLU(), nn.Linear(hidden_size // 2, 1))

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        output, _ = self.lstm(inputs.transpose(0, 1))
        last_hidden = output[-1]
        return self.head(last_hidden)


def direction_accuracy(predictions: torch.Tensor, targets: torch.Tensor, previous_prices: torch.Tensor) -> float:
    direction_pred = torch.sign(predictions - previous_prices)
    direction_true = torch.sign(targets - previous_prices)
    return (direction_pred == direction_true).float().mean().item()


def main() -> None:
    torch.manual_seed(42)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    close_prices = torch.tensor([
        150.1,
        151.2,
        149.8,
        150.5,
        152.3,
        153.1,
        154.0,
        153.5,
        154.2,
        155.8,
        156.3,
        157.6,
        158.4,
        157.9,
        158.7,
        159.5,
        160.2,
        161.0,
        160.7,
        161.3,
        162.1,
        163.4,
        162.8,
        163.7,
        164.5,
        165.2,
        166.1,
        165.5,
        166.8,
        167.4,
        168.5,
        169.2,
        168.9,
        169.7,
        170.3,
        169.8,
        170.6,
        171.2,
        172.5,
        173.1,
        172.8,
        173.5,
        174.2,
        175.0,
        176.3,
        175.8,
        176.6,
        177.4,
        178.1,
        178.9,
    ],
        dtype=torch.float32,
    )

    normalized_prices = (close_prices - close_prices.mean()) / close_prices.std()
    window_size = 5

    dataset, full_features, full_targets = build_dataset(normalized_prices, window_size)
    loader = DataLoader(dataset, batch_size=8, shuffle=True)

    model = PriceLSTM().to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

    print(f"Training on {device}")
    epochs = 300
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        running_accuracy = 0.0
        sample_count = 0

        for batch_features, batch_targets in loader:
            batch_features = batch_features.to(device)
            batch_targets = batch_targets.to(device)

            optimizer.zero_grad()
            predictions = model(batch_features)
            loss = criterion(predictions, batch_targets)
            loss.backward()
            optimizer.step()

            batch_size = batch_features.shape[0]
            running_loss += loss.item() * batch_size
            last_known = batch_features[:, -1, :].view(batch_size, -1)
            running_accuracy += direction_accuracy(
                predictions.detach().cpu(), batch_targets.detach().cpu(), last_known.detach().cpu()
            ) * batch_size
            sample_count += batch_size

        epoch_loss = running_loss / sample_count
        epoch_accuracy = running_accuracy / sample_count

        if (epoch + 1) % 50 == 0 or epoch == 0:
            print(f"Epoch {epoch + 1:03d} | Loss: {epoch_loss:.6f} | Directional accuracy: {epoch_accuracy:.3f}")

    model.eval()
    with torch.no_grad():
        features = full_features.to(device)
        targets = full_targets.to(device)
        predictions = model(features)
        final_loss = criterion(predictions, targets).item()
        last_known = features[:, -1, :]
        final_accuracy = direction_accuracy(
            predictions.detach().cpu(), targets.detach().cpu(), last_known.detach().cpu()
        )

    print(f"Final evaluation — Loss: {final_loss:.6f}, Directional accuracy: {final_accuracy:.3f}")


if __name__ == "__main__":
    main()
