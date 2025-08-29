/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ClientHomePage from "./ClientHomePage";

const mockClubs = [
  {
    _id: "1",
    hash: "h1",
    name: "Alpha Club",
    sport: "Football",
    logoUrl: "http://example.com/logo.png",
    location: { lat: 51.5, long: -0.1, address: "London" },
  },
  {
    _id: "2",
    hash: "h2",
    name: "Beta Club",
    sport: "Football",
    location: { lat: 48.8, long: 2.35, address: "Paris" },
  },
];

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ClientHomePage", () => {
  it("renders clubs after fetch", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ data: mockClubs, totalPages: 1 }),
    });

    render(<ClientHomePage sport="Football" />);

    // Wait for clubs
    const alpha = await screen.findByText("Alpha Club");
    const beta = await screen.findByText("Beta Club");

    expect(alpha).toBeInTheDocument();
    expect(beta).toBeInTheDocument();
  });

  it("shows 'No results found' when API returns empty", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ data: [], totalPages: 1 }),
    });

    render(<ClientHomePage sport="Football" />);

    const noResults = await screen.findByText("No results found.");
    expect(noResults).toBeInTheDocument();
  });

  it("filters clubs by search input", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ data: mockClubs, totalPages: 1 }),
    });

    render(<ClientHomePage sport="Football" />);
    await screen.findByText("Alpha Club");

    fireEvent.change(screen.getByPlaceholderText(/Search by name/i), {
      target: { value: "Alpha" },
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("search=Alpha")
      );
    });
  });

  it("handles pagination", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ data: mockClubs, totalPages: 3 }),
    });

    render(<ClientHomePage sport="Football" />);
    await screen.findByText("Alpha Club");

    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("page=2"));
    });

    fireEvent.click(screen.getByText("Prev"));
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("page=1"));
    });
  });

  it("adds user location when geolocation button clicked", async () => {
    const mockGeolocation = {
      getCurrentPosition: jest.fn((success) =>
        success({ coords: { latitude: 40, longitude: -70 } })
      ),
    };
    // @ts-ignore
    global.navigator.geolocation = mockGeolocation;

    mockFetch.mockResolvedValue({
      json: async () => ({ data: mockClubs, totalPages: 1 }),
    });

    render(<ClientHomePage sport="Football" />);
    await screen.findByText("Alpha Club");

    fireEvent.click(screen.getByText("📍"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("location=40%2C-70")
      );
    });
  });
});
